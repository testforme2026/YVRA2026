const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Ensure environment variables are loaded
require('dotenv').config();

const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
let credentialOption;

try {
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    credentialOption = admin.credential.cert(serviceAccount);
    console.log('Firebase initialized using local serviceAccountKey.json file.');
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    credentialOption = admin.credential.cert(serviceAccount);
    console.log('Firebase initialized using FIREBASE_SERVICE_ACCOUNT environment variable.');
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // Falls back to standard environment-configured credentials path
    credentialOption = admin.credential.applicationDefault();
    console.log('Firebase initialized using GOOGLE_APPLICATION_CREDENTIALS environment path.');
  } else {
    // Fallback to Application Default Credentials (ADC)
    credentialOption = admin.credential.applicationDefault();
    console.log('Firebase initialized using Application Default Credentials (ADC).');
  }
} catch (error) {
  console.warn(
    'Warning: Firebase credentials could not be resolved automatically.\n' +
    'Please place your serviceAccountKey.json in the project root or configure environment variables.\n' +
    `Error details: ${error.message}`
  );
}

let projectId = process.env.FIREBASE_PROJECT_ID;

if (!projectId || projectId === 'your_firebase_project_id_here') {
  if (fs.existsSync(serviceAccountPath)) {
    try {
      const serviceAccount = require(serviceAccountPath);
      projectId = serviceAccount.project_id;
    } catch (e) {
      // fallback
    }
  }
  if (!projectId || projectId === 'your_firebase_project_id_here') {
    projectId = 'yvra-bot';
  }
}

// Initialize Firebase App
if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: credentialOption,
    projectId: projectId
  });
}

const db = admin.firestore();

// Create references for the three required collections
const productsRef = db.collection('products');
const customersRef = db.collection('customers');
const ordersRef = db.collection('orders');

/**
 * Fetches all available products from the Firestore database.
 * 
 * @returns {Promise<Array<Object>>} List of products
 */
async function getInventory() {
  try {
    const snapshot = await productsRef.get();
    const products = [];
    snapshot.forEach(doc => {
      products.push({ id: doc.id, ...doc.data() });
    });
    return products;
  } catch (error) {
    console.error('Error fetching inventory from Firestore:', error);
    return [];
  }
}

const defaultSettings = {
  address: "Room A-428, 4th floor, Times City, Times Mall, ရန်ကုန်မြို့",
  phone: "+95 9 431 61291",
  tiktok: "tiktok.com/@yvra.official7",
  greetings: "မင်္ဂလာပါရှင်။ YVRA Online Store မှ ကြိုဆိုပါတယ်။ လှပပြီး ဒီဇိုင်းဆန်းသစ်တဲ့ အမျိုးသမီးအဝတ်အထည်များကို အဓိကထားရောင်းချပေးနေပါတယ်ရှင်။ ဘာများကူညီပေးရမလဲရှင့်။",
  payment: "ငွေပေးချေမှုကို KBZPay, WavePay သို့မဟုတ် Mobile Banking တို့ဖြင့် ကြိုတင်လွှဲအပ်နိုင်သလို၊ ရန်ကုန်/မန္တလေးမြို့များအတွက် အိမ်ရောက်ငွေချေ (COD) စနစ်ဖြင့်လည်း ရရှိနိုင်ပါတယ်ရှင်။",
  tagline: "YVRA COLLECTION / SUMMER 2026",
  aboutText: "YVRA Boutique သည် လှပဆန်းသစ်ပြီး ခေတ်မီဆန်းပြားသော အမျိုးသမီးဝတ် အထည်များကို စိတ်ကြိုက် Cutting၊ ဒီဇိုင်းများနှင့်အတူ အရည်အသွေးမြင့်မားစွာ ဖန်တီးချုပ်လုပ်ပေးနေသော Boutique ဆိုင်ဖြစ်ပါတယ်ရှင်။",
  contactText: "လူကိုယ်တိုင် ဆိုင်သို့လာရောက်လေ့လာလိုပါက ရန်ကုန်မြို့ Times City တွင် ဖွင့်လှစ်ထားပြီး၊ ဖုန်း သို့မဟုတ် TikTok Messenger မှတစ်ဆင့်လည်း အချိန်မရွေး ဆက်သွယ်မေးမြန်းမှာယူနိုင်ပါတယ်ရှင်။"
};

/**
 * Fetches YVRA store configurations from Firestore, initializing them if missing.
 */
async function getSettings() {
  try {
    const docRef = db.collection('config').doc('store_settings');
    const doc = await docRef.get();
    if (!doc.exists) {
      await docRef.set(defaultSettings);
      return defaultSettings;
    }
    return { ...defaultSettings, ...doc.data() };
  } catch (error) {
    console.error('Error fetching settings from Firestore:', error);
    return defaultSettings;
  }
}

/**
 * Updates YVRA store configurations in Firestore.
 */
async function updateSettings(settings) {
  try {
    const docRef = db.collection('config').doc('store_settings');
    await docRef.set(settings, { merge: true });
    return true;
  } catch (error) {
    console.error('Error updating settings in Firestore:', error);
    return false;
  }
}

module.exports = {
  admin,
  db,
  productsRef,
  customersRef,
  ordersRef,
  getInventory,
  getSettings,
  updateSettings,
  // Object mapping for convenience
  collections: {
    products: productsRef,
    customers: customersRef,
    orders: ordersRef
  }
};
