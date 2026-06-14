const { getSettings } = require('./firebase');

// Define keyword matching criteria
const KEYWORDS = [
  {
    category: "greetings",
    patterns: [
      /^(မင်္ဂလာပါ|မဂ်လာပါ|ဟဲလို|ဟိုင်း|hello|hi|hey|mingalarbar)$/i,
      /^(hi|hello)\s+(admin|yvra|sis|sisy|sis)$/i
    ]
  },
  {
    category: "location",
    patterns: [
      /ဆိုင်ကဘယ်မှာလဲ/i,
      /လိပ်စာလေး/i,
      /ဘယ်နားမှာလဲ/i,
      /ဆိုင်လိပ်စာ/i,
      /address/i,
      /location/i
    ]
  },
  {
    category: "payment",
    patterns: [
      /ဘယ်လိုငွေချေရမလဲ/i,
      /kpay/i,
      /wavepay/i,
      /wave/i,
      /ငွေချေ/i,
      /payment/i,
      /banking/i,
      /ငွေလွှဲ/i
    ]
  },
  {
    category: "admin",
    patterns: [
      /admin/i,
      /လူနဲ့ပြောချင်/i,
      /ph number/i,
      /ဖုန်းနံပါတ်/i,
      /ဆက်သွယ်ရမယ့်/i,
      /viber/i,
      /messenger/i
    ]
  }
];

/**
 * Checks if a user message matches any static reply keyword criteria.
 * Fetches settings dynamically from Firestore (config/store_settings).
 * 
 * @param {string} message The incoming message text.
 * @returns {Promise<string|null>} The matching static reply string, or null if no match.
 */
async function checkStaticReply(message) {
  if (!message) return null;
  
  const text = message.trim().toLowerCase();
  
  // Iterate through keyword definitions
  for (const item of KEYWORDS) {
    for (const pattern of item.patterns) {
      let isMatch = false;
      if (pattern instanceof RegExp) {
        isMatch = pattern.test(text);
      } else {
        isMatch = text.includes(pattern);
      }
      
      if (isMatch) {
        console.log(`[Static Replies] Match found for category: "${item.category}"`);
        
        // Fetch latest store settings from Firestore
        const settings = await getSettings();
        
        if (item.category === 'greetings') {
          return settings.greetings || "မင်္ဂလာပါရှင်။ YVRA Online Store မှ ကြိုဆိုပါတယ်။";
        }
        if (item.category === 'location') {
          return `YVRA ဆိုင်လိပ်စာကတော့ ${settings.address || 'Room A-428, 4th floor, Times City, Times Mall, ရန်ကုန်မြို့'} ဖြစ်ပါတယ်ရှင်။ ရန်ကုန်၊ မန္တလေးနှင့် အခြားမြန်မာတစ်နိုင်ငံလုံးရှိ သတ်မှတ်ထားသောမြို့များကို အိမ်တိုင်ရာရောက် (Cash on Delivery) စနစ်ဖြင့် ပို့ဆောင်ပေးပါတယ်ရှင်။`;
        }
        if (item.category === 'payment') {
          return settings.payment || "ငွေပေးချေမှုကို KBZPay, WavePay တို့ဖြင့် ကြိုတင်လွှဲအပ်နိုင်ပါတယ်ရှင်။";
        }
        if (item.category === 'admin') {
          return `ဟုတ်ကဲ့ပါရှင်၊ YVRA ဆိုင်ရဲ့ ဆက်သွယ်ရန် ဖုန်းနံပါတ်ကတော့ ${settings.phone || '+95 9 431 61291'} ဖြစ်ပြီး TikTok page ကတော့ ${settings.tiktok || 'tiktok.com/@yvra.official7'} ဖြစ်ပါတယ်ရှင်။ အသေးစိတ်အချက်အလက်များအတွက် Admin နှင့် တိုက်ရိုက်ချိတ်ဆက်ပေးပါမည်။ ခေတ္တစောင့်ဆိုင်းပေးပါရှင်။`;
        }
      }
    }
  }
  
  return null; // Fallback to Gemini
}

module.exports = {
  checkStaticReply
};
