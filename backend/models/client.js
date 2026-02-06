import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    sparse: true // Allows multiple null values but unique non-null values
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  totalOrders: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  lastOrderDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for faster lookups
clientSchema.index({ name: 1 });
clientSchema.index({ email: 1 });
clientSchema.index({ phone: 1 });

// Method to update client stats after order
clientSchema.methods.updateStats = async function(orderTotal) {
  this.totalOrders += 1;
  this.totalSpent += orderTotal;
  this.lastOrderDate = new Date();
  await this.save();
};

const client = mongoose.model('Client', clientSchema);
export default client;