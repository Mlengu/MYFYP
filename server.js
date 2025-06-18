const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();

mongoose.connect('mongodb://127.0.0.1:27017/ROSE_BUZZ', ).then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.log('❌ DB connection error:', err));

const espSchema = new mongoose.Schema({
  espName: String,
  foodName: String,
  price: Number,
}, { timestamps: true });

const ESP = mongoose.model('ESP', espSchema);

const orderSchema = new mongoose.Schema({
  customerName: String,
  buzzerId: String,
  items: [
    {
      foodName: String,
      price: Number
    }
  ],
  status: {
    type: String,
    enum: ['pending', 'ready', 'completed'], // <-- add 'completed'
    default: 'pending'
  }
}, { timestamps: true });

const Order = mongoose.model("Order", orderSchema);


app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // contains REGISTRATION.html, dashboard.html

app.post('/register-food', async (req, res) => {
  try {
    const { espName, foodName, price } = req.body;

    // Upsert: Update if exists, or insert new
    const updatedDevice = await ESP.findOneAndUpdate(
      { espName },
      { $set: { foodName, price } },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(200).json({ message: 'Device registered or updated.', device: updatedDevice });
  } catch (err) {
    console.error('❌ Registration error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


app.get('/get-devices', async (req, res) => {
  try {
    const devices = await ESP.find();
    res.json(devices);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching devices' });
  }
});

// Save new food order
app.post("/order", async (req, res) => {
  try {
    const { customerName, buzzerId, items } = req.body;

    if (!buzzerId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Missing required order data." });
    }

    const newOrder = new Order({
      customerName,
      buzzerId,
      items
    });

    await newOrder.save();
    res.status(201).json({ message: "Order saved successfully.", order: newOrder });
  } catch (err) {
    console.error("❌ Order error:", err);
    res.status(500).json({ message: "Server error saving order." });
  }
});

// Get recent orders for analytics
app.get('/orders', async (req, res) => {
  try {
    const status = req.query.status;
    const query = status ? { status } : {};
    const orders = await Order.find(query).sort({ createdAt: -1 }).limit(50); // Most recent
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

// Mark an order as completed
app.post('/complete-order', async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ message: "Missing orderId" });

    const updated = await Order.findByIdAndUpdate(
      orderId,
      { status: 'completed' },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Order not found" });

    res.json({ message: "Order marked as completed", order: updated });
  } catch (err) {
    res.status(500).json({ message: "Error completing order" });
  }
});

// Get completed orders
app.get('/completed-orders', async (req, res) => {
  try {
    const orders = await Order.find({ status: 'completed' }).sort({ updatedAt: -1 }).limit(50);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching completed orders' });
  }
});


const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});


