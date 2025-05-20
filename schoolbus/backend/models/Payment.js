import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema({
  // Common fields
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'paypal', 'bank_transfer', 'direct_deposit', 'cash'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  transactionId: {
    type: String,
    sparse: true
  },
  description: {
    type: String
  },
  
  // Parent payment fields
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true
  },
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    sparse: true
  },
  childrenIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Child',
  }],
  
  // Driver payment fields
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true
  },
  payPeriod: {
    start: Date,
    end: Date
  },
  
  // Payment breakdown
  subtotal: Number,
  taxes: Number,
  fees: Number,
  discounts: Number,
  
  // Metadata
  metadata: {
    type: Map,
    of: String
  }
}, {
  timestamps: true
});

// Pre-save validation to ensure either parentId or driverId is provided
PaymentSchema.pre('save', function(next) {
  if (!this.parentId && !this.driverId) {
    return next(new Error('A payment must be associated with either a parent or a driver'));
  }
  next();
});

// Pre-save hook to set description if not provided
PaymentSchema.pre('save', function(next) {
  if (!this.description) {
    if (this.parentId) {
      this.description = `Payment for school bus services`;
    } else if (this.driverId) {
      this.description = `Salary payment to driver`;
    }
  }
  next();
});

// Method to generate receipt data
PaymentSchema.methods.generateReceiptData = function() {
  return {
    paymentId: this._id,
    amount: this.amount,
    paymentDate: this.paymentDate,
    paymentMethod: this.paymentMethod,
    transactionId: this.transactionId,
    description: this.description,
    status: this.status
  };
};

// Static to find parent payments for a specific date range
PaymentSchema.statics.findParentPayments = function(parentId, startDate, endDate) {
  return this.find({
    parentId,
    paymentDate: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ paymentDate: -1 });
};

// Static to find driver payments for a specific date range
PaymentSchema.statics.findDriverPayments = function(driverId, startDate, endDate) {
  return this.find({
    driverId,
    paymentDate: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ paymentDate: -1 });
};

const Payment = mongoose.model('Payment', PaymentSchema);

export default Payment;