import express from 'express';
const clientRouter = express.Router();
import Client from "../models/client.js";
import Order from "../models/order.js";

// @route   POST /api/clients
// @desc    Create a new client
// @access  Public
clientRouter.post('/', async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;

    // Validate input
    if (!name) {
      return res.status(400).json({ 
        success: false,
        message: 'Client name is required' 
      });
    }

    // Check if client with same email already exists (if email provided)
    if (email) {
      const existingClient = await Client.findOne({ email });
      if (existingClient) {
        return res.status(400).json({ 
          success: false,
          message: 'Client with this email already exists' 
        });
      }
    }

    const client = new Client({
      name,
      email,
      phone,
      address
    });

    const savedClient = await client.save();
    
    res.status(201).json({
      success: true,
      message: 'Client created successfully',
      data: savedClient
    });
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while creating client',
      error: error.message 
    });
  }
});

// @route   GET /api/clients
// @desc    Get all clients
// @access  Public
clientRouter.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    
    let query = {};

    // Search by name, email, or phone
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const clients = await Client.find(query).sort({ lastOrderDate: -1, name: 1 });

    res.status(200).json({
      success: true,
      count: clients.length,
      data: clients
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching clients',
      error: error.message 
    });
  }
});

// @route   GET /api/clients/:id
// @desc    Get single client with order history
// @access  Public
clientRouter.get('/:id', async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);

    if (!client) {
      return res.status(404).json({ 
        success: false,
        message: 'Client not found' 
      });
    }

    // Get all orders for this client
    const orders = await Order.find({ client: req.params.id }).sort({ orderDate: -1 });

    res.status(200).json({
      success: true,
      data: {
        client,
        orders
      }
    });
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching client',
      error: error.message 
    });
  }
});

// @route   PUT /api/clients/:id
// @desc    Update client information
// @access  Public
clientRouter.put('/:id', async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;

    const client = await Client.findById(req.params.id);

    if (!client) {
      return res.status(404).json({ 
        success: false,
        message: 'Client not found' 
      });
    }

    // Update fields
    if (name) client.name = name;
    if (email !== undefined) client.email = email;
    if (phone !== undefined) client.phone = phone;
    if (address) client.address = address;

    const updatedClient = await client.save();

    res.status(200).json({
      success: true,
      message: 'Client updated successfully',
      data: updatedClient
    });
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while updating client',
      error: error.message 
    });
  }
});

// @route   DELETE /api/clients/:id
// @desc    Delete a client (only if no orders exist)
// @access  Public
clientRouter.delete('/:id', async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);

    if (!client) {
      return res.status(404).json({ 
        success: false,
        message: 'Client not found' 
      });
    }

    // Check if client has any orders
    const orderCount = await Order.countDocuments({ client: req.params.id });
    
    if (orderCount > 0) {
      return res.status(400).json({ 
        success: false,
        message: `Cannot delete client with ${orderCount} existing order(s). Delete orders first.`
      });
    }

    await client.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Client deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while deleting client',
      error: error.message 
    });
  }
});

// @route   GET /api/clients/:id/orders
// @desc    Get all orders for a specific client
// @access  Public
clientRouter.get('/:id/orders', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = { client: req.params.id };

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

    const orders = await Order.find(query).sort({ orderDate: -1 });

    const totalAmount = orders.reduce((sum, order) => sum + order.grandTotal, 0);

    res.status(200).json({
      success: true,
      count: orders.length,
      totalAmount,
      data: orders
    });
  } catch (error) {
    console.error('Error fetching client orders:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching orders',
      error: error.message 
    });
  }
});

export {clientRouter};