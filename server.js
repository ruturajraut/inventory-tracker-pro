const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// ========== NEW: Socket.IO Setup ==========
const http = require('http');  // Node's built-in HTTP module
const socketIo = require('socket.io');
// ==========================================

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 3000;

// ========== NEW: Create HTTP Server ==========
// Express normally creates this internally.
// We need to create it explicitly so Socket.IO can attach to it.
const server = http.createServer(app);
// ============================================

// ========== NEW: Attach Socket.IO to Server ==========
const io = socketIo(server, {
    cors: {
        origin: "*",  // Allow any frontend to connect (we'll restrict this later)
        methods: ["GET", "POST"]
    }
});
// ====================================================

// Body parser middleware
app.use(express.json());

app.use(express.static('public'));

// Basic route
app.get('/', (req, res) => {
    res.send('✅ Inventory System Server is Running with WebSockets!');
});

// Product routes
// app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/products', require('./routes/productRoutes')(io));

// =====================================================
// ========== NEW: WebSocket Connection Logic ==========
// =====================================================

// This runs whenever a NEW client (browser tab) connects
io.on('connection', (socket) => {
    console.log(`🟢 New client connected: ${socket.id}`);
    
    // Send a welcome message to just THIS client
    socket.emit('welcome', {
        message: 'Connected to Inventory System',
        socketId: socket.id,
        timestamp: new Date().toISOString()
    });
    
    // Tell everyone EXCEPT this client that someone joined
    socket.broadcast.emit('user-joined', {
        message: 'A new user joined the inventory dashboard',
        socketId: socket.id
    });
    
    // ========== Listen for stock updates from client ==========
    // This runs when a client says "stock just changed"
    socket.on('stock-updated', (data) => {
        console.log(`📦 Stock updated for product: ${data.productName}`);
        console.log(`   New quantity: ${data.newQuantity}`);
        console.log(`   Updated by: ${socket.id}`);
        
        // Broadcast to ALL OTHER clients (not the sender)
        socket.broadcast.emit('refresh-stock', {
            productId: data.productId,
            productName: data.productName,
            newQuantity: data.newQuantity,
            updatedBy: socket.id,
            timestamp: new Date().toISOString()
        });
        
        // Optional: Send confirmation back to sender
        socket.emit('stock-update-confirmed', {
            message: 'Your stock update was broadcast to all users',
            timestamp: new Date().toISOString()
        });
    });
    // ======================================================
    
    // ========== Listen for chat/test messages ==========
    socket.on('test-message', (message) => {
        console.log(`💬 Message from ${socket.id}: ${message}`);
        
        // Echo back to everyone (including sender)
        io.emit('broadcast-message', {
            from: socket.id,
            text: message,
            timestamp: new Date().toISOString()
        });
    });
    // ==================================================
    
    // This runs when a client disconnects (closes browser tab)
    socket.on('disconnect', () => {
        console.log(`🔴 Client disconnected: ${socket.id}`);
        
        // Tell everyone else that this user left
        io.emit('user-left', {
            message: 'A user left the inventory dashboard',
            socketId: socket.id,
            timestamp: new Date().toISOString()
        });
    });
});

// ========== IMPORTANT: Change app.listen to server.listen ==========
server.listen(PORT, () => {
    console.log(`🚀 Server is live at http://localhost:${PORT}`);
    console.log(`📡 WebSocket server is ready for connections`);
});
// ===================================================================