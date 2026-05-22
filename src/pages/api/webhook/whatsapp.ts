import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

interface WhatsAppWebhookPayload {
  event: string;
  device_id?: string;
  phone_number: string;
  message: {
    from: string;
    to: string;
    body?: string;
    type: "text" | "image" | "document" | "video" | "audio";
    media_url?: string;
    timestamp: string;
  };
  metadata?: Record<string, any>;
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
    const payload = req.body as WhatsAppWebhookPayload;

    // Validate required fields
    if (!payload.message || !payload.message.from) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    // Find device by phone number or device_id
    const deviceQuery = supabase
      .from("sender_devices")
      .select("id, user_id, phone_number");

    if (payload.device_id) {
      deviceQuery.eq("id", payload.device_id);
    } else if (payload.phone_number) {
      deviceQuery.eq("phone_number", payload.phone_number);
    } else {
      return res.status(400).json({ error: "Device identification required" });
    }

    const { data: device, error: deviceError } = await deviceQuery.single();

    if (deviceError || !device) {
      console.error("Device not found:", deviceError);
      return res.status(404).json({ error: "Device not found" });
    }

    // Find or create contact
    let contactId: string | null = null;
    const { data: existingContact } = await supabase
      .from("contacts")
      .select("id")
      .eq("user_id", device.user_id)
      .eq("phone", payload.message.from)
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
          user_id: device.user_id,
          name: payload.message.from,
          phone: payload.message.from,
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
        device_id: device.id,
        contact_id: contactId,
        phone_number: payload.message.from,
        direction: "incoming",
        message_type: payload.message.type || "text",
        content: payload.message.body || "",
        media_url: payload.message.media_url,
        status: "delivered",
        timestamp: payload.message.timestamp || new Date().toISOString(),
        metadata: payload.metadata || {},
      });

    if (logError) {
      console.error("Failed to save message log:", logError);
      return res.status(500).json({ error: "Failed to save message" });
    }

    // Check if AI auto-reply is enabled
    const { data: settings } = await supabase
      .from("settings")
      .select("ai_enabled, ai_provider, openai_api_key, gemini_api_key, openai_model, gemini_model")
      .eq("user_id", device.user_id)
      .maybeSingle();

    if (settings?.ai_enabled && payload.message.body) {
      // Queue AI response (implement AI reply logic here)
      await processAIReply(
        device.id,
        payload.message.from,
        payload.message.body,
        settings
      );
    }

    return res.status(200).json({
      success: true,
      message: "Webhook processed successfully",
      contact_id: contactId,
    });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
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
              content: "You are a helpful customer service assistant. Respond professionally and concisely.",
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
                    text: `You are a helpful customer service assistant. Respond professionally and concisely.\n\nUser message: ${message}`,
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

    if (aiResponse) {
      // Save AI response to message_logs
      await supabase.from("message_logs").insert({
        device_id: deviceId,
        phone_number: phoneNumber,
        direction: "outgoing",
        message_type: "text",
        content: aiResponse,
        status: "sent",
        metadata: { ai_generated: true, provider: settings.ai_provider },
      });

      // TODO: Send actual WhatsApp message via Dripsender/Cloudchat API
      // This would require making API call to the provider
    }
  } catch (error) {
    console.error("AI reply error:", error);
  }
}