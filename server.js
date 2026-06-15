const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { verifyWebhook, handleMessage } = require('./webhookController');
const { productsRef, getInventory, getSettings, updateSettings } = require('./firebase');

// Ensure environment variables are loaded
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable Cross-Origin Resource Sharing (CORS)
app.use(cors());

// Parse incoming request bodies in JSON format
app.use(bodyParser.json());

// Parse URL-encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));

// Root route for status check
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'online',
    message: 'YVRA Bot E-commerce Backend Server is running.',
    timestamp: new Date()
  });
});

// Facebook Messenger Webhook verification endpoint (GET)
app.get('/webhook/messenger', verifyWebhook);

// Facebook Messenger Webhook events receiving endpoint (POST)
app.post('/webhook/messenger', handleMessage);

// REST API FOR ADMIN PRODUCTS CRUD & CONFIG

// GET all products
app.get('/api/products', async (req, res) => {
  try {
    const products = await getInventory();
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE a product
app.post('/api/products', async (req, res) => {
  try {
    const { name, price, description, stock, imageUrl, variants, featured } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({ error: "Missing required fields: name, price" });
    }
    
    // Calculate total stock from variants if available, otherwise use provided stock
    let finalStock = Number(stock || 0);
    let finalVariants = [];
    if (variants && Array.isArray(variants)) {
      finalVariants = variants.map(v => ({
        color: v.color || "",
        size: v.size || "",
        stock: Number(v.stock || 0)
      }));
      finalStock = finalVariants.reduce((sum, v) => sum + v.stock, 0);
    }

    const isFeatured = !!featured;
    if (isFeatured) {
      const snapshot = await productsRef.where('featured', '==', true).get();
      if (!snapshot.empty) {
        const batch = productsRef.firestore.batch();
        snapshot.docs.forEach(doc => {
          batch.update(doc.ref, { featured: false });
        });
        await batch.commit();
      }
    }

    const newProduct = {
      name,
      price: Number(price),
      description: description || "",
      stock: finalStock,
      imageUrl: imageUrl || "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800",
      variants: finalVariants,
      featured: isFeatured
    };
    const docRef = await productsRef.add(newProduct);
    res.status(201).json({ id: docRef.id, ...newProduct });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE a product
app.put('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, description, stock, imageUrl, variants, featured } = req.body;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (price !== undefined) updateData.price = Number(price);
    if (description !== undefined) updateData.description = description;
    
    let finalVariants = undefined;
    if (variants !== undefined && Array.isArray(variants)) {
      finalVariants = variants.map(v => ({
        color: v.color || "",
        size: v.size || "",
        stock: Number(v.stock || 0)
      }));
      updateData.variants = finalVariants;
      updateData.stock = finalVariants.reduce((sum, v) => sum + v.stock, 0);
    } else if (stock !== undefined) {
      updateData.stock = Number(stock);
    }
    
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;

    if (featured !== undefined) {
      const isFeatured = !!featured;
      updateData.featured = isFeatured;
      if (isFeatured) {
        const snapshot = await productsRef.where('featured', '==', true).get();
        if (!snapshot.empty) {
          const batch = productsRef.firestore.batch();
          snapshot.docs.forEach(doc => {
            if (doc.id !== id) {
              batch.update(doc.ref, { featured: false });
            }
          });
          await batch.commit();
        }
      }
    }

    await productsRef.doc(id).update(updateData);
    res.status(200).json({ id, ...updateData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE a product
app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await productsRef.doc(id).delete();
    res.status(200).json({ message: "Product deleted successfully", id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET shop settings
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await getSettings();
    res.status(200).json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE shop settings
app.post('/api/settings', async (req, res) => {
  try {
    const success = await updateSettings(req.body);
    if (success) {
      res.status(200).json({ message: "Settings updated successfully", settings: req.body });
    } else {
      res.status(500).json({ error: "Failed to update settings" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error] Unhandled exception:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Start the server
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`  Server is listening on port: ${PORT}`);
    console.log(`  Webhook URL: http://localhost:${PORT}/webhook/messenger`);
    console.log(`==================================================`);
  });
}

module.exports = app;
