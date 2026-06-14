const { generateAIResponse } = require('./geminiService');
const { checkStaticReply } = require('./staticReplies');

// Ensure environment variables are loaded
require('dotenv').config();

const VERIFY_TOKEN = process.env.MESSENGER_VERIFY_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.MESSENGER_ACCESS_TOKEN;

/**
 * GET /webhook/messenger
 * Handles Facebook's Webhook verification.
 */
function verifyWebhook(req, res) {
  // Parse the query params
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('[Webhook Verification] Received request.');

  // Check if a token and mode is in the query string of the request
  if (mode && token) {
    // Check the mode and token sent are correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      // Respond with the challenge token from the request
      console.log('[Webhook Verification] SUCCESS.');
      return res.status(200).send(challenge);
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      console.warn('[Webhook Verification] FAILED: Token mismatch.');
      return res.sendStatus(403);
    }
  }

  return res.sendStatus(400);
}

/**
 * POST /webhook/messenger
 * Receives incoming messaging events from Facebook.
 */
function handleMessage(req, res) {
  const body = req.body;

  // Check this is an event from a page subscription
  if (body.object === 'page') {
    // Iterate over each entry - there may be multiple if batched
    body.entry.forEach(async (entry) => {
      // Get the message. entry.messaging is an array, but standard setup
      // will usually contain only one message at a time
      const webhookEvent = entry.messaging ? entry.messaging[0] : null;
      if (!webhookEvent) return;

      console.log('[Webhook Message] Event received:', JSON.stringify(webhookEvent, null, 2));

      // Get the sender PSID (Page Scoped ID) and the message payload
      const senderId = webhookEvent.sender.id;
      const userMessage = webhookEvent.message ? webhookEvent.message.text : null;

      if (userMessage) {
        // Asynchronously process the message and send the response back
        // to avoid blocking the webhook response. Facebook requires a 200 OK within 20 seconds.
        processMessageAndReply(senderId, userMessage).catch((err) => {
          console.error('[Webhook Message] Error processing messaging event:', err);
        });
      } else {
        console.log('[Webhook Message] Event does not contain text. Skipping response.');
      }
    });

    // Returns a '200 OK' to all requests
    res.status(200).send('EVENT_RECEIVED');
  } else {
    // Return a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }
}

/**
 * Processes message using Gemini service and sends reply back to Facebook.
 */
async function processMessageAndReply(senderId, userMessage) {
  console.log(`[Processing] Sender: ${senderId} | Message: "${userMessage}"`);

  // 1. Check if the message matches a static auto-reply first to save API rate limits
  const staticReply = await checkStaticReply(userMessage);
  if (staticReply) {
    console.log(`[Processing] Sender: ${senderId} | Resolved via Static Auto-Reply`);
    await sendMessengerReply(senderId, staticReply);
    return;
  }

  // 2. Generate reply using the Gemini AI Service
  const replyText = await generateAIResponse(userMessage, senderId);

  // Check if Gemini's response contains a product image URL: [IMAGE: <url>]
  const imageRegex = /\[IMAGE:\s*(https?:\/\/[^\]]+)\]/i;
  const match = replyText.match(imageRegex);

  if (match) {
    const imageUrl = match[1].trim();
    // Strip the image tag from the text reply so the text remains clean
    const cleanReplyText = replyText.replace(imageRegex, '').trim();

    // 1. Send the text description first
    if (cleanReplyText) {
      await sendMessengerReply(senderId, cleanReplyText);
    }
    // 2. Send the image attachment
    await sendMessengerImageReply(senderId, imageUrl);
  } else {
    // Standard response if no image is present
    await sendMessengerReply(senderId, replyText);
  }
}

/**
 * Sends a message back to the sender via the Facebook Send API.
 */
async function sendMessengerReply(senderId, text) {
  console.log(`[Send Reply] Sender: ${senderId} | Text: "${text}"`);

  if (!PAGE_ACCESS_TOKEN) {
    console.warn('[Send Reply] Skipping dispatch: MESSENGER_ACCESS_TOKEN is not defined.');
    return;
  }

  const payload = {
    recipient: { id: senderId },
    message: { text: text },
  };

  try {
    // Using Node.js native global fetch (standard in modern Node.js)
    const response = await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('[Facebook Send API Error]', data.error);
    } else {
      console.log('[Facebook Send API] Success:', data);
    }
  } catch (error) {
    console.error('Error invoking Facebook Send API:', error);
  }
}

/**
 * Sends an image attachment back to the sender via the Facebook Send API.
 */
async function sendMessengerImageReply(senderId, imageUrl) {
  console.log(`[Send Image] Sender: ${senderId} | Image URL: "${imageUrl}"`);

  if (!PAGE_ACCESS_TOKEN) {
    console.warn('[Send Image] Skipping dispatch: MESSENGER_ACCESS_TOKEN is not defined.');
    return;
  }

  const payload = {
    recipient: { id: senderId },
    message: {
      attachment: {
        type: 'image',
        payload: {
          url: imageUrl,
          is_reusable: true
        }
      }
    }
  };

  try {
    const response = await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('[Facebook Send API Image Error]', data.error);
    } else {
      console.log('[Facebook Send API Image] Success:', data);
    }
  } catch (error) {
    console.error('Error invoking Facebook Send API for image:', error);
  }
}

module.exports = {
  verifyWebhook,
  handleMessage
};
