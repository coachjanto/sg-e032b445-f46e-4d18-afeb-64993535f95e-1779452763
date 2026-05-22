import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

interface CloudChatWebhookPayload {
  event: string;
  data: {
    id?: string;
    from?: string;
    to?: string;
    body?: string;
    type?: string;
    timestamp?: string;
    instanceId?: string;
    messageId?: string;
    [key: string]: any;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only accept POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const payload = req.body as CloudChatWebhookPayload;

    // Log incoming webhook for debugging
    console.log("CloudChat Webhook received:", JSON.stringify(payload, null, 2));

    // Only process message.received events
    if (payload.event !== "message.received") {
      return res.status(200).json({ 
        success: true, 
        message: "Event acknowledged but not processed" 
      });
    }

    const messageData = payload.data;

    // Validate required fields
    if (!messageData || !messageData.from) {
      return res.status(400).json({ error: "Invalid payload - missing required fields" });
    }

    // Find device by instanceId from Cloudchat
    const { data: device, error: deviceError } = await supabase
      .from("sender_devices")
      .select("id, user_id, phone_number")
      .eq("type", "cloudchat")
      .contains("credentials_encrypted", messageData.instanceId ? { instanceId: messageData.instanceId } : {})
      .maybeSingle();

    if (deviceError || !device) {
      console.error("Device not found:", deviceError);
      // If no specific device found, try to find any cloudchat device for this user
      const { data: anyDevice } = await supabase
        .from("sender_devices")
        .select("id, user_id, phone_number")
        .eq("type", "cloudchat")
        .limit(1)
        .maybeSingle();

      if (!anyDevice) {
        return res.status(404).json({ error: "No CloudChat device found" });
      }
    }

    const deviceId = device?.id;
    const userId = device?.user_id;

    if (!deviceId || !userId) {
      return res.status(404).json({ error: "Device configuration incomplete" });
    }

    // Extract phone number (remove @ suffix if present)
    const phoneNumber = messageData.from.split("@")[0];

    // Find or create contact
    let contactId: string | null = null;
    const { data: existingContact } = await supabase
      .from("contacts")
      .select("id")
      .eq("user_id", userId)
      .eq("phone", phoneNumber)
      .maybeSingle();

    if (existingContact) {
      contactId = existingContact.id;

      // Update last_contacted timestamp
      await supabase
        .from("contacts")
        .update({ 
          last_contacted: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", contactId);
    } else {
      // Create new contact
      const { data: newContact, error: contactError } = await supabase
        .from("contacts")
        .insert({
          user_id: userId,
          name: phoneNumber,
          phone: phoneNumber,
          last_contacted: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (contactError) {
        console.error("Failed to create contact:", contactError);
      } else {
        contactId = newContact.id;
      }
    }

    // Save message to message_logs
    const { error: logError } = await supabase
      .from("message_logs")
      .insert({
        device_id: deviceId,
        contact_id: contactId,
        phone_number: phoneNumber,
        direction: "incoming",
        message_type: messageData.type || "text",
        content: messageData.body || "",
        status: "delivered",
        timestamp: messageData.timestamp || new Date().toISOString(),
        metadata: {
          cloudchat_message_id: messageData.messageId || messageData.id,
          cloudchat_instance_id: messageData.instanceId,
          raw_data: messageData,
        },
      });

    if (logError) {
      console.error("Failed to save message log:", logError);
      return res.status(500).json({ error: "Failed to save message" });
    }

    // Check if AI auto-reply is enabled
    const { data: settings } = await supabase
      .from("settings")
      .select("ai_enabled, ai_provider, openai_api_key, gemini_api_key, openai_model, gemini_model, cloudchat_enabled, cloudchat_api_key")
      .eq("user_id", userId)
      .maybeSingle();

    if (settings?.ai_enabled && settings?.cloudchat_enabled && messageData.body) {
      // Queue AI response
      await processAIReply(
        deviceId,
        phoneNumber,
        messageData.body,
        settings
      );
    }

    return res.status(200).json({
      success: true,
      message: "Webhook processed successfully",
      contact_id: contactId,
    });
  } catch (error: any) {
    console.error("CloudChat webhook processing error:", error);
    return res.status(500).json({ error: error.message });
  }
}

async function processAIReply(
  deviceId: string,
  phoneNumber: string,
  message: string,
  settings: any
) {
  try {
    let aiResponse = "";

    if (settings.ai_provider === "openai" && settings.openai_api_key) {
      // Call OpenAI API
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${settings.openai_api_key}`,
        },
        body: JSON.stringify({
          model: settings.openai_model || "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are a helpful customer service assistant. Respond professionally and concisely in Indonesian or English based on the customer's language.",
            },
            {
              role: "user",
              content: message,
            },
          ],
          max_tokens: 500,
        }),
      });

      const data = await response.json();
      aiResponse = data.choices?.[0]?.message?.content || "";
    } else if (settings.ai_provider === "gemini" && settings.gemini_api_key) {
      // Call Gemini API
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${settings.gemini_model || "gemini-pro"}:generateContent?key=${settings.gemini_api_key}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You are a helpful customer service assistant. Respond professionally and concisely in Indonesian or English based on the customer's language.\n\nUser message: ${message}`,
                  },
                ],
              },
            ],
          }),
        }
      );

      const data = await response.json();
      aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }

    if (aiResponse && settings.cloudchat_api_key) {
      // Save AI response to message_logs
      await supabase.from("message_logs").insert({
        device_id: deviceId,
        phone_number: phoneNumber,
        direction: "outgoing",
        message_type: "text",
        content: aiResponse,
        status: "sent",
        metadata: { 
          ai_generated: true, 
          provider: settings.ai_provider 
        },
      });

      // Send message via CloudChat API
      try {
        const credentials = await supabase
          .from("sender_devices")
          .select("credentials_encrypted")
          .eq("id", deviceId)
          .single();

        if (credentials.data?.credentials_encrypted) {
          const creds = JSON.parse(credentials.data.credentials_encrypted);
          
          // Send message using CloudChat API
          const sendResponse = await fetch("https://api.cloudchat.id/api/public/v1/messages", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${settings.cloudchat_api_key}`,
            },
            body: JSON.stringify({
              to: phoneNumber,
              message: aiResponse,
              instanceId: creds.instanceId,
            }),
          });

          if (!sendResponse.ok) {
            console.error("Failed to send CloudChat message:", await sendResponse.text());
          }
        }
      } catch (error) {
        console.error("Error sending CloudChat message:", error);
      }
    }
  } catch (error) {
    console.error("AI reply error:", error);
  }
}