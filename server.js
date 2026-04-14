const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 3000;

// Body parser middleware (allows us to read JSON data)
app.use(express.json());

// Basic route
app.get('/', (req, res) => {
    res.send('✅ Inventory System Server is Running!');
});

// Product routes
app.use('/api/products', require('./routes/productRoutes'));

app.listen(PORT, () => {
    console.log(`🚀 Server is live at http://localhost:${PORT}`);
});