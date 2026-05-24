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

    // Get or create contact
    const { data: existingContact } = await supabase
      .from("contacts")
      .select("id")
      .eq("phone", phoneNumber)
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
        contact_id: contactId,
        message: messageBody,
        direction: "incoming",
        status: "delivered",
        external_id: messageId,
        provider: "dripsender"
      });

    if (messageError) {
      console.error("Error saving message:", messageError);
      return res.status(500).json({ error: "Failed to save message" });
    }

    // Check if AI auto-reply is enabled
    await handleAIAutoReply(contactId, phoneNumber, messageBody);

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

    // Generate AI response
    let aiResponse = "";

    if (settings.ai_provider === "openai" && settings.openai_api_key) {
      aiResponse = await generateOpenAIResponse(
        incomingMessage,
        settings.openai_api_key,
        settings.openai_model
      );
    } else if (settings.ai_provider === "gemini" && settings.gemini_api_key) {
      aiResponse = await generateGeminiResponse(
        incomingMessage,
        settings.gemini_api_key,
        settings.gemini_model
      );
    }

    if (aiResponse && settings.dripsender_api_key) {
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
          contact_id: contactId,
          message: aiResponse,
          direction: "outgoing",
          status: "sent",
          provider: "dripsender"
        });
    }
  } catch (error) {
    console.error("AI auto-reply error:", error);
  }
}

async function generateOpenAIResponse(
  message: string,
  apiKey: string,
  model: string
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
          content: "You are a helpful WhatsApp assistant. Keep responses concise and friendly."
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
  model: string
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
                text: `You are a helpful WhatsApp assistant. Keep responses concise and friendly.\n\nUser message: ${message}`
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