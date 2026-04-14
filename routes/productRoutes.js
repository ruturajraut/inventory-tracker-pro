const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// We'll pass 'io' from server.js. This is a function that returns the router.
module.exports = function(io) {
    
    // @route   POST /api/products
    // @desc    Create a new product
    router.post('/', async (req, res) => {
        try {
            const product = await Product.create(req.body);
            
            // ========== NEW: Notify all clients about new product ==========
            io.emit('product-created', {
                productId: product._id,
                productName: product.name,
                quantity: product.quantity,
                message: `New product added: ${product.name}`,
                timestamp: new Date().toISOString()
            });
            // ================================================================
            
            res.status(201).json({
                success: true,
                data: product
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    });
    
    // @route   GET /api/products
    // @desc    Get all products
    router.get('/', async (req, res) => {
        try {
            const products = await Product.find();
            res.status(200).json({
                success: true,
                count: products.length,
                data: products
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });
    
    // @route   GET /api/products/:id
    // @desc    Get single product
    router.get('/:id', async (req, res) => {
        try {
            const product = await Product.findById(req.params.id);
            
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }
            
            res.status(200).json({
                success: true,
                data: product
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });
    
    // @route   PUT /api/products/:id
    // @desc    Update a product (This triggers the WebSocket event!)
    router.put('/:id', async (req, res) => {
        try {
            const oldProduct = await Product.findById(req.params.id);
            
            const product = await Product.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true, runValidators: true }
            );
            
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }
            
            // ========== NEW: Check if quantity changed ==========
            if (oldProduct && oldProduct.quantity !== product.quantity) {
                // Notify all clients about stock change
                io.emit('stock-changed', {
                    productId: product._id,
                    productName: product.name,
                    oldQuantity: oldProduct.quantity,
                    newQuantity: product.quantity,
                    change: product.quantity - oldProduct.quantity,
                    message: `Stock updated: ${product.name} (${oldProduct.quantity} → ${product.quantity})`,
                    timestamp: new Date().toISOString()
                });
            }
            // ===================================================
            
            res.status(200).json({
                success: true,
                data: product
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    });
    
    // @route   DELETE /api/products/:id
    // @desc    Delete a product
    router.delete('/:id', async (req, res) => {
        try {
            const product = await Product.findByIdAndDelete(req.params.id);
            
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }
            
            // ========== NEW: Notify all clients about deletion ==========
            io.emit('product-deleted', {
                productId: product._id,
                productName: product.name,
                message: `Product deleted: ${product.name}`,
                timestamp: new Date().toISOString()
            });
            // =============================================================
            
            res.status(200).json({
                success: true,
                message: 'Product deleted successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });
    
    return router;
};