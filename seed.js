const { productsRef } = require('./firebase');

const sampleProducts = [
  {
    name: "Chole Bow Dress",
    price: 37500,
    description: "၃၇,၅၀၀ ကျပ် ထဲနဲ့ ဒီလို Premium ဆန်တဲ့ Design မျိုးလိုချင်တယ်ဆိုရင်တော့ Cutting ရော Design ရော အသေအချာ ဖန်တီးထားတဲ့ Chole Bow Dress လေး ရှိနေပြီနော်။",
    stock: 35, // Sum of variant stocks
    imageUrl: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=60",
    variants: [
      { color: "Black", size: "M", stock: 20 },
      { color: "White", size: "L", stock: 15 }
    ]
  },
  {
    name: "Elegant Floral Maxi Dress",
    price: 42000,
    description: "ပေါ့ပေါ့ပါးပါးနဲ့ လှပဆန်းသစ်တဲ့ ပန်းပွင့်ဒီဇိုင်း Elegant Floral Maxi Dress လေးပါ။ ပွဲတက်ဖြစ်ဖြစ် နေ့စဉ်ဝတ်ဖြစ်ဖြစ် အဆင်ပြေပါတယ်။",
    stock: 15,
    imageUrl: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop&q=60",
    variants: [
      { color: "Pink", size: "S", stock: 10 },
      { color: "Cream", size: "M", stock: 5 }
    ]
  },
  {
    name: "Modern Linen Jumpsuit",
    price: 35000,
    description: "Linen သားကောင်းကောင်းနဲ့ ချုပ်လုပ်ထားပြီး ပုံကျလှပတဲ့ ခေတ်မီ Linen Jumpsuit ဖြစ်ပါတယ်။ သက်သောင့်သက်သာရှိပြီး စမတ်ကျစေပါတယ်။",
    stock: 10,
    imageUrl: "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=800&auto=format&fit=crop&q=60",
    variants: [
      { color: "Olive", size: "M", stock: 8 },
      { color: "Navy", size: "L", stock: 2 }
    ]
  }
];

async function seedDatabase() {
  console.log('[Seed Script] Starting database seeding with variants...');
  try {
    // Clear existing products
    const snapshot = await productsRef.get();
    if (!snapshot.empty) {
      console.log(`[Seed Script] Cleaning up ${snapshot.size} existing products...`);
      const batch = productsRef.firestore.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log('[Seed Script] Cleanup completed.');
    }

    // Insert new products with variants
    const batch = productsRef.firestore.batch();
    sampleProducts.forEach((product) => {
      const docRef = productsRef.doc(); // Auto-generated ID
      batch.set(docRef, product);
      console.log(`[Seed Script] Queued product with variants: ${product.name}`);
    });

    await batch.commit();
    console.log('[Seed Script] SUCCESS: Database seeded with variants successfully!');
    process.exit(0);
  } catch (error) {
    console.error('[Seed Script] FAILED:', error);
    process.exit(1);
  }
}

seedDatabase();
