import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

/**
 * Dripsender Webhook Endpoint
 * Receives incoming WhatsApp messages from Dripsender
 * 
 * TODO: Update payload structure based on actual Dripsender webhook format
 * This is a placeholder structure that needs to be verified with Dripsender docs
 */

interface DripsenderWebhookPayload {
  event?: string;
  message?: {
    id: string;
    from: string;
    body: string;
    timestamp: number;
    type?: string;
  };
  contact?: {
    phone: string;
    name?: string;
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
    const payload: DripsenderWebhookPayload = req.body;
    console.log("Dripsender webhook received:", JSON.stringify(payload, null, 2));

    // TODO: Verify webhook signature if Dripsender provides one
    // const signature = req.headers["x-dripsender-signature"];

    // Extract message data (adjust based on actual Dripsender payload)
    const phoneNumber = payload.message?.from || payload.contact?.phone;
    const messageBody = payload.message?.body;
    const messageId = payload.message?.id;
    const contactName = payload.contact?.name;

    if (!phoneNumber || !messageBody) {
      console.log("Missing required fields:", { phoneNumber, messageBody });
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Get user from settings (webhook is tied to user's API key)
    const { data: settingsData } = await supabase
      .from("settings")
      .select("user_id")
      .eq("dripsender_enabled", true)
      .maybeSingle();

    if (!settingsData) {
      console.log("No user found with Dripsender enabled");
      return res.status(400).json({ error: "Dripsender not configured" });
    }

    const userId = settingsData.user_id;

    // Get or create sender device for Dripsender
    let deviceId: string;
    const { data: existingDevice } = await supabase
      .from("sender_devices")
      .select("id")
      .eq("user_id", userId)
      .eq("type", "dripsender")
      .maybeSingle();

    if (existingDevice) {
      deviceId = existingDevice.id;
    } else {
      // Create device entry for Dripsender
      const { data: newDevice, error: deviceError } = await supabase
        .from("sender_devices")
        .insert({
          user_id: userId,
          label: "Dripsender",
          type: "dripsender",
          status: "connected"
        })
        .select()
        .single();

      if (deviceError || !newDevice) {
        console.error("Error creating device:", deviceError);
        return res.status(500).json({ error: "Failed to create device" });
      }

      deviceId = newDevice.id;
    }

    // Get or create contact
    const { data: existingContact } = await supabase
      .from("contacts")
      .select("id")
      .eq("phone", phoneNumber)
      .eq("user_id", userId)
      .maybeSingle();

    let contactId: string;

    if (existingContact) {
      contactId = existingContact.id;
      
      // Update last_contacted
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
          phone: phoneNumber,
          name: contactName || phoneNumber,
          tags: ["dripsender"],
          last_contacted: new Date().toISOString()
        })
        .select()
        .single();

      if (contactError || !newContact) {
        console.error("Error creating contact:", contactError);
        return res.status(500).json({ error: "Failed to create contact" });
      }

      contactId = newContact.id;
    }

    // Save message to message_logs
    const { error: messageError } = await supabase
      .from("message_logs")
      .insert({
        device_id: deviceId,
        contact_id: contactId,
        phone_number: phoneNumber,
        content: messageBody,
        direction: "incoming",
        status: "delivered",
        metadata: { external_id: messageId, provider: "dripsender" }
      });

    if (messageError) {
      console.error("Error saving message:", messageError);
      return res.status(500).json({ error: "Failed to save message" });
    }

    // Check if AI auto-reply is enabled
    await handleAIAutoReply(deviceId, contactId, phoneNumber, messageBody);

    return res.status(200).json({ 
      success: true,
      message: "Webhook processed successfully" 
    });

  } catch (error) {
    console.error("Dripsender webhook error:", error);
    return res.status(500).json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

async function handleAIAutoReply(
  deviceId: string,
  contactId: string,
  phoneNumber: string,
  incomingMessage: string
) {
  try {
    // Get user's AI settings
    const { data: settings } = await supabase
      .from("settings")
      .select("*")
      .single();

    if (!settings?.ai_enabled) {
      return;
    }

    // Check keyword triggers if configured
    if (settings.ai_keywords && settings.ai_keywords.length > 0) {
      const hasKeyword = settings.ai_keywords.some((keyword: string) =>
        incomingMessage.toLowerCase().includes(keyword.toLowerCase())
      );
      
      if (!hasKeyword) {
        console.log("Message does not contain trigger keywords, skipping AI response");
        return;
      }
    }

    // Check business hours if enabled
    if (settings.ai_business_hours_enabled) {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
      
      const isWithinBusinessHours = 
        currentTime >= settings.ai_business_hours_start &&
        currentTime <= settings.ai_business_hours_end;

      if (!isWithinBusinessHours) {
        console.log("Outside business hours, skipping AI response");
        return;
      }
    }

    // Generate AI response with custom system prompt
    let aiResponse = "";

    if (settings.ai_provider === "openai" && settings.openai_api_key) {
      aiResponse = await generateOpenAIResponse(
        incomingMessage,
        settings.openai_api_key,
        settings.openai_model,
        settings.ai_system_prompt
      );
    } else if (settings.ai_provider === "gemini" && settings.gemini_api_key) {
      aiResponse = await generateGeminiResponse(
        incomingMessage,
        settings.gemini_api_key,
        settings.gemini_model,
        settings.ai_system_prompt
      );
    }

    if (aiResponse && settings.dripsender_api_key) {
      // Apply response delay (natural typing simulation)
      const delayMs = (settings.ai_response_delay || 2) * 1000;
      await new Promise(resolve => setTimeout(resolve, delayMs));

      // Send reply via Dripsender
      await sendDripsenderMessage(
        phoneNumber,
        aiResponse,
        settings.dripsender_api_key
      );

      // Log the reply
      await supabase
        .from("message_logs")
        .insert({
          device_id: deviceId,
          contact_id: contactId,
          phone_number: phoneNumber,
          content: aiResponse,
          direction: "outgoing",
          status: "sent",
          metadata: { provider: "dripsender", ai_generated: true }
        });
    }
  } catch (error) {
    console.error("AI auto-reply error:", error);
  }
}

async function generateOpenAIResponse(
  message: string,
  apiKey: string,
  model: string,
  systemPrompt: string
): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 150,
      temperature: 0.7
    })
  });

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

async function generateGeminiResponse(
  message: string,
  apiKey: string,
  model: string,
  systemPrompt: string
): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${systemPrompt}\n\nUser message: ${message}`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 150
        }
      })
    }
  );

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

async function sendDripsenderMessage(
  phoneNumber: string,
  message: string,
  apiKey: string
): Promise<void> {
  // TODO: Update endpoint and payload based on actual Dripsender API documentation
  // This is a placeholder structure
  
  const endpoint = "https://driplink.site/api/v1/messages/send"; // TODO: Verify endpoint
  
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "X-API-Key": apiKey // TODO: Verify auth header format
      },
      body: JSON.stringify({
        to: phoneNumber,
        message: message,
        type: "text"
        // TODO: Add other required fields based on Dripsender docs
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Dripsender send message error:", error);
      throw new Error(`Failed to send message: ${error}`);
    }

    console.log("Message sent via Dripsender:", { phoneNumber, message });
  } catch (error) {
    console.error("Error sending Dripsender message:", error);
    throw error;
  }
}