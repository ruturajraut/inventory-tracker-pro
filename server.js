const express = require('express');
const app = express();
const PORT = 3000;

// Basic route - This is what shows in the browser
app.get('/', (req, res) => {
    res.send('✅ Inventory System Server is Running!');
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Server is live at http://localhost:${PORT}`);
});