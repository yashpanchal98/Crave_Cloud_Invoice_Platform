import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  foodPacket: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  lineTotal: {
    type: Number,
    required: true
  }
});

const orderSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  clientName: {
    type: String,
    required: true,
    trim: true
  },
  orderDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  items: [orderItemSchema],
  grandTotal: {
    type: Number,
    required: true,
    min: 0
  },
  invoiceNumber: {
    type: String,
    unique: true,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'completed'
  }
}, {
  timestamps: true
});

// Index for faster queries
orderSchema.index({ orderDate: 1 });
orderSchema.index({ client: 1 });
orderSchema.index({ invoiceNumber: 1 });

const order = mongoose.model('Order', orderSchema);
export default order;