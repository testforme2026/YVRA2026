const { GoogleGenAI } = require('@google/genai');
const { db, getInventory } = require('./firebase');

// Ensure environment variables are loaded
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn('Warning: GEMINI_API_KEY is not defined in the environment variables.');
}

// Initialize the Google Gen AI Client
const ai = new GoogleGenAI({ apiKey });

// Define the model to use (Gemini 2.5 Flash is recommended for general chat and speed)
const MODEL_NAME = 'gemini-2.5-flash';

/**
 * System instruction defining the behavior, persona, and rules of the sales assistant.
 */
const SYSTEM_INSTRUCTION = `မင်းက YVRA ဆိုတဲ့ အွန်လိုင်းစတိုးရဲ့ ဖော်ရွေပြီး ယဉ်ကျေးတဲ့ Customer Service Chatbot တစ်ခုဖြစ်တယ်။ Customer တွေ မေးလာတဲ့ မေးခွန်းတွေကို မြန်မာဘာသာစကားနဲ့ သဘာဝကျကျ၊ ယဉ်ယဉ်ကျေးကျေးနဲ့ ကူညီဖြေကြားပေးရမယ်။ ဆိုင်အကြောင်း အချက်အလက်များ- YVRA ဆိုင်သည်လှပပြီး ဒီဇိုင်းဆန်းသစ်တဲ့ အမျိုးသမီး အဝတ်အထည်များ] ကို အဓိကထား ရောင်းချပါသည်။ အွန်လိုင်းမှတဆင့် ငွေပေးချေနိုင်ပြီး မြန်မာတစ်နိုင်ငံလုံး (သတ်မှတ်ထားသောမြို့များ) ကို အိမ်တိုင်ရာရောက် ပို့ဆောင်ပေးပါသည်။ မေးခွန်းတွေကို ဖော်ရွေစွာနဲ့ တိုတိုရှင်းရှင်း ဖြေပါ။ ကိုယ်မသိတဲ့ အချက်အလက်၊ ဒါမှမဟုတ် ဈေးနှုန်းအတိအကျ မရှိတဲ့ကိစ္စဆိုရင် Admin နဲ့ ဆက်သွယ်ပေးမယ်လို့ ယဉ်ကျေးစွာ ပြန်ဖြေပါ။`;

/**
 * Tool definition for Gemini Function Calling.
 * This describes the function 'checkInventory' that the model can request to execute.
 */
const tools = [
  {
    functionDeclarations: [
      {
        name: 'checkInventory',
        description: 'Check the real-time stock level and price of a product in the store.',
        parameters: {
          type: 'OBJECT',
          properties: {
            productName: {
              type: 'STRING',
              description: 'The name or keyword of the product to check stock for (e.g., "T-shirt", "running shoes").'
            }
          },
          required: ['productName']
        }
      }
    ]
  }
];

/**
 * Mock function to represent an inventory check database operation.
 * In a real implementation, you would query the Firestore 'products' collection.
 */
async function realCheckInventory(productName) {
  console.log(`[Database Query] Checking real database inventory for: "${productName}"`);
  try {
    const products = await getInventory();
    const query = productName.toLowerCase().trim();
    
    // Find matching product (case-insensitive substring search)
    const foundProduct = products.find(p => 
      p.name.toLowerCase().includes(query) || 
      query.includes(p.name.toLowerCase())
    );
    
    if (foundProduct) {
      console.log(`[Database Query] SUCCESS: Found product ${foundProduct.name} (Stock: ${foundProduct.stock}, Price: ${foundProduct.price})`);
      return { 
        found: true, 
        name: foundProduct.name, 
        stock: foundProduct.stock, 
        price: `${foundProduct.price} MMK`,
        description: foundProduct.description,
        imageUrl: foundProduct.imageUrl
      };
    } else {
      console.log(`[Database Query] Product not found for query: "${productName}"`);
      return { found: false, message: `Product "${productName}" is not found in our catalog.` };
    }
  } catch (error) {
    console.error('[Database Query] Error querying inventory:', error);
    return { found: false, error: true, message: 'Failed to retrieve inventory data.' };
  }
}

/**
 * Processes a message from a user, manages session history, and invokes the Gemini API.
 * Handles the complete function calling execution loop.
 * 
 * @param {string} userMessage The raw text message sent by the customer.
 * @param {string} senderId The unique ID of the sender (e.g. Facebook Messenger Page Scoped User ID).
 * @returns {Promise<string>} The response text from the AI assistant.
 */
async function generateAIResponse(userMessage, senderId) {
  try {
    console.log(`[Gemini Service] Generating response for sender: ${senderId}`);

    // Fetch dynamic inventory from database
    const inventory = await getInventory();
    const inventoryText = inventory.map(p => {
      const variantsText = p.variants && p.variants.length > 0
        ? p.variants.map(v => `- Color: ${v.color}, Size: ${v.size}, Stock: ${v.stock}`).join('\n    ')
        : `Stock: ${p.stock}`;
      return `- Product Name: ${p.name}\n  Price: ${p.price} MMK\n  Variants:\n    ${variantsText}\n  Description: ${p.description}\n  Image URL: ${p.imageUrl}`;
    }).join('\n\n');

    const dynamicInstruction = `${SYSTEM_INSTRUCTION}

ဆိုင်ရှိ ပစ္စည်းစာရင်း (Real-time Inventory):
${inventoryText}

RULES:
1. Image display rules:
- Do NOT show the product image in every single response. That is repetitive and annoying.
- You must ONLY include the product image URL in your response in the exact format '[IMAGE: <imageUrl>]' in these two specific scenarios:
  * Scenario A: The very first time the customer inquires about or mentions a specific product in the conversation.
  * Scenario B: When the customer explicitly asks to see the photo, image, or says "ပုံလေးပြပါ" / "ပုံလေးပြပေးပါ" / "ပုံကြည့်ချင်တယ်".
- Example: "ဒီမှာ Chole Bow Dress လေးပါနော် \n[IMAGE: https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800]"

2. Stock Level Logic (Variants aware):
- A product can have multiple variants (with different Colors, Sizes, and Stock levels).
- If the customer asks about availability of a specific variant (e.g. "Chole Bow Dress အနက်ရောင် M size ရှိလား"):
  * Look up the matching variant in that product's list.
  * If that variant's Stock > 0: Confirm availability in natural, polite Burmese (e.g., "ရပါသေးတယ်ရှင်"). Do NOT mention the exact stock count.
  * If that variant's Stock === 0: Explain that this specific color/size is out of stock, and politely ask for their phone number so you can notify them when it's back (e.g., "အနက်ရောင် M size လေးကတော့ လောလောဆယ် ကုန်သွားပါပြီရှင့်၊ ပစ္စည်းပြန်ရရင် အကြောင်းကြားပေးဖို့ ဖုန်းနံပါတ်လေး ပေးထားခဲ့လို့ ရပါတယ်ရှင်").
- If the customer asks generally about product availability (e.g. "Chole Bow Dress ရှိလား"):
  * Check if the product has ANY variants with Stock > 0.
  * If yes: Confirm it is available in polite Burmese, and list the available colors and sizes that are currently in stock (e.g., "ရပါဦးမယ်ရှင်။ လောလောဆယ် အနက်ရောင် M size နဲ့ အဖြူရောင် L size တို့ ရနိုင်ပါတယ်ရှင်။").
  * If all variants are out of stock: Reply politely that it is sold out and ask for their phone number to notify them.`;

    // 1. Fetch recent conversation history from Firestore for this senderId
    const chatHistory = await getChatHistoryFromDB(senderId);

    // 2. Initialize Gemini chat session with pre-existing history and dynamic instruction
    const chat = ai.chats.create({
      model: MODEL_NAME,
      history: chatHistory,
      config: {
        systemInstruction: dynamicInstruction,
        tools: tools
      }
    });

    // 3. Send the message to Gemini
    let response = await chat.sendMessage({ message: userMessage });

    // 4. Handle Function Calling / Tool Execution Loop
    // The Gemini model may request to execute tools one or more times
    while (response.functionCalls && response.functionCalls.length > 0) {
      const functionCall = response.functionCalls[0];
      const { name, args } = functionCall;

      console.log(`[Gemini Service] Model requested function call: ${name} with args:`, args);

      let functionResult;
      if (name === 'checkInventory') {
        functionResult = await realCheckInventory(args.productName);
      } else {
        functionResult = { error: `Function '${name}' is not supported.` };
      }

      // Send the tool's result back to the model to continue the conversation
      // In the new @google/genai SDK, we pass the function response back to the chat session
      response = await chat.sendMessage({
        message: [
          {
            functionResponse: {
              name: name,
              response: functionResult
            }
          }
        ]
      });
    }

    const replyText = response.text || 'I apologize, but I could not formulate a response. How else can I assist you?';

    // 5. Save the exchange back to Firestore in the background
    await saveExchangeToDB(senderId, userMessage, replyText);

    return replyText;
  } catch (error) {
    console.error('Error generating response from Gemini API:', error);
    return 'I am experiencing technical difficulties at the moment. Please try again later.';
  }
}

/**
 * Placeholder helper to fetch chat history from Firestore.
 */
async function getChatHistoryFromDB(senderId) {
  // Return an empty list or fetch from database.
  // Format must map to Gemini SDK: [{ role: 'user'|'model', parts: [{ text: '...' }] }]
  
  /* Example Firestore fetch:
  const customerRef = db.collection('customers').doc(senderId);
  const messagesSnapshot = await customerRef.collection('messages')
    .orderBy('timestamp', 'asc')
    .limit(10)
    .get();
  
  return messagesSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      role: data.sender === 'user' ? 'user' : 'model',
      parts: [{ text: data.text }]
    };
  });
  */
  
  return []; // Return empty history by default for new chats
}

/**
 * Placeholder helper to save the conversation turn to Firestore.
 */
async function saveExchangeToDB(senderId, userText, modelReply) {
  // In a real application, write the user message and model response to your Firestore collections
  console.log(`[Database Logs] Saving chat history for ${senderId}`);
  
  /* Example Firestore write:
  const batch = db.batch();
  const customerRef = db.collection('customers').doc(senderId);
  
  // Update customer's last active timestamp
  batch.set(customerRef, { lastActive: new Date() }, { merge: true });
  
  // Write user message
  const userMsgRef = customerRef.collection('messages').doc();
  batch.set(userMsgRef, {
    text: userText,
    sender: 'user',
    timestamp: new Date()
  });
  
  // Write model reply
  const modelMsgRef = customerRef.collection('messages').doc();
  batch.set(modelMsgRef, {
    text: modelReply,
    sender: 'model',
    timestamp: new Date()
  });
  
  await batch.commit();
  */
}

module.exports = {
  generateAIResponse,
  realCheckInventory
};
