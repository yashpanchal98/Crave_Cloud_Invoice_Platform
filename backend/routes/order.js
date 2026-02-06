import express from 'express';
const orderRouter = express.Router();
import Order from "../models/order.js";
import Client from "../models/client.js";
import {generateInvoicePDF} from '../utility/pdfGenerator.js';
import  {generateConsolidatedInvoicePDF}  from '../utility/pdfGenerator.js';


// Generate unique invoice number
const generateInvoiceNumber = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `INV-${timestamp}-${random}`;
};

// @route   POST /api/orders
// @desc    Create a new order
// @access  Public
orderRouter.post('/', async (req, res) => {
  try {
    const { clientId, clientName, orderDate, items } = req.body;

    // Validate input
    if (!clientId || !clientName || !items || items.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Client ID, name, and at least one item are required' 
      });
    }

    // Verify client exists
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ 
        success: false,
        message: 'Client not found' 
      });
    }

    // Calculate line totals and grand total
    let grandTotal = 0;
    const processedItems = items.map(item => {
      const lineTotal = item.quantity * item.unitPrice;
      grandTotal += lineTotal;
      return {
        foodPacket: item.foodPacket,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: lineTotal
      };
    });

    // Create order
    const order = new Order({
      client: clientId,
      clientName,
      orderDate: orderDate || new Date(),
      items: processedItems,
      grandTotal,
      invoiceNumber: generateInvoiceNumber()
    });

    const savedOrder = await order.save();

    // Update client statistics
    await client.updateStats(grandTotal);
    
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: savedOrder
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while creating order',
      error: error.message 
    });
  }
});

// @route   GET /api/orders
// @desc    Get all orders with optional filters
// @access  Public
orderRouter.get('/', async (req, res) => {
  try {
    const { startDate, endDate, clientName, clientId } = req.query;
    
    let query = {};

    // Filter by date range
    if (startDate || endDate) {
      query.orderDate = {};
      if (startDate) query.orderDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.orderDate.$lte = end;
      }
    }

    // Filter by client
    if (clientId) {
      query.client = clientId;
    } else if (clientName) {
      query.clientName = { $regex: clientName, $options: 'i' };
    }

    const orders = await Order.find(query)
      .populate('client', 'name email phone')
      .sort({ orderDate: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching orders',
      error: error.message 
    });
  }
});

// @route   GET /api/orders/:id
// @desc    Get single order by ID
// @access  Public
orderRouter.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('client');

    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: 'Order not found' 
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching order',
      error: error.message 
    });
  }
});

// @route   GET /api/orders/invoice/:id
// @desc    Download invoice PDF for an order
// @access  Public
orderRouter.get('/invoice/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('client');

    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: 'Order not found' 
      });
    }

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition', 
      `attachment; filename=invoice-${order.invoiceNumber}.pdf`
    );

    // Generate and stream PDF
    generateInvoicePDF(order,res);
  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while generating invoice',
      error: error.message 
    });
  }
});

// @route   GET /api/orders/consolidated-invoice/:clientId
// @desc    Download consolidated invoice PDF for a client (all orders in date range)
// @access  Public
orderRouter.get('/consolidated-invoice/:clientId', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const client = await Client.findById(req.params.clientId);
    if (!client) {
      return res.status(404).json({ 
        success: false,
        message: 'Client not found' 
      });
    }

    let query = { client: req.params.clientId };

    // Filter by date range
    if (startDate || endDate) {
      query.orderDate = {};
      if (startDate) query.orderDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.orderDate.$lte = end;
      }
    }

    const orders = await Order.find(query).sort({ orderDate: 1 });

    if (orders.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'No orders found for this client in the specified date range' 
      });
    }

    // Set response headers for PDF download
    const dateRange = startDate && endDate 
      ? `${startDate}_to_${endDate}` 
      : 'all_orders';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition', 
      `attachment; filename=consolidated-invoice-${client.name.replace(/\s+/g, '-')}-${dateRange}.pdf`
    );

    // Generate consolidated PDF
    generateConsolidatedInvoicePDF(client, orders, res);
  } catch (error) {
    console.error('Error generating consolidated invoice:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while generating consolidated invoice',
      error: error.message 
    });
  }
});

// @route   GET /api/orders/stats/daily
// @desc    Get daily sales statistics
// @access  Public
orderRouter.get('/stats/daily', async (req, res) => {
  try {
    const { date } = req.query;
    
    let targetDate;
    if (date) {
      targetDate = new Date(date);
    } else {
      targetDate = new Date();
    }

    // Set to start of day
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    // Set to end of day
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const orders = await Order.find({
      orderDate: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }).populate('client', 'name email phone');

    const dailyTotal = orders.reduce((sum, order) => sum + order.grandTotal, 0);
    const orderCount = orders.length;

    res.status(200).json({
      success: true,
      data: {
        date: targetDate.toISOString().split('T')[0],
        totalSales: dailyTotal,
        orderCount: orderCount,
        orders: orders
      }
    });
  } catch (error) {
    console.error('Error fetching daily stats:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching daily statistics',
      error: error.message 
    });
  }
});

// @route   DELETE /api/orders/:id
// @desc    Delete an order
// @access  Public
orderRouter.delete('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: 'Order not found' 
      });
    }

    // Update client stats
    const client = await Client.findById(order.client);
    if (client) {
      client.totalOrders = Math.max(0, client.totalOrders - 1);
      client.totalSpent = Math.max(0, client.totalSpent - order.grandTotal);
      await client.save();
    }

    await order.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while deleting order',
      error: error.message 
    });
  }
});

export default orderRouter;