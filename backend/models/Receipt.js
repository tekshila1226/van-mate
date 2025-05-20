import mongoose from 'mongoose';

const ReceiptSchema = new mongoose.Schema({
  // Receipt number
  receiptNumber: {
    type: String,
    unique: true
  },
  
  // Reference to invoice
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    required: true
  },
  
  // Reference to parent
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Payment details
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'paypal', 'bank_transfer', 'cash', 'check'],
    required: true
  },
  
  paymentDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  
  // Transaction identifiers
  transactionId: {
    type: String
  },
  
  // If payment is processed through a payment gateway
  paymentGateway: {
    type: String,
    enum: ['stripe', 'paypal', 'manual', 'other']
  },
  
  // Status
  status: {
    type: String,
    enum: ['processed', 'failed', 'refunded'],
    default: 'processed'
  },
  
  // Notes
  notes: String
}, {
  timestamps: true
});

// Auto-generate receipt number
ReceiptSchema.pre('save', async function(next) {
  if (this.isNew && !this.receiptNumber) {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    
    // Find the highest receipt number
    const lastReceipt = await this.constructor.findOne({
      receiptNumber: { $regex: `^RCPT-${currentYear}${currentMonth.toString().padStart(2, '0')}` }
    }).sort({ receiptNumber: -1 });
    
    let nextNumber = 1;
    if (lastReceipt) {
      // Extract the numeric part and increment
      const parts = lastReceipt.receiptNumber.split('-');
      if (parts.length >= 2) {
        const lastNumber = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }
    }
    
    // Format: RCPT-YYYYMM-XXXX
    this.receiptNumber = `RCPT-${currentYear}${currentMonth.toString().padStart(2, '0')}-${nextNumber.toString().padStart(4, '0')}`;
  }
  
  next();
});

// Method to generate PDF data
ReceiptSchema.methods.generatePdfData = async function() {
  try {
    // Populate related data
    await this.populate('invoiceId parentId');
    
    return {
      receiptNumber: this.receiptNumber,
      receiptDate: this.paymentDate,
      amount: this.amount,
      paymentMethod: this.paymentMethod,
      transactionId: this.transactionId,
      invoiceNumber: this.invoiceId.invoiceNumber,
      invoicePeriod: this.invoiceId.period,
      parentName: `${this.parentId.firstName} ${this.parentId.lastName}`,
      parentEmail: this.parentId.email
    };
  } catch (error) {
    console.error('Error generating PDF data:', error);
    throw error;
  }
};

// Static to find receipts by parent
ReceiptSchema.statics.findByParent = function(parentId) {
  return this.find({ parentId }).sort({ createdAt: -1 });
};

const Receipt = mongoose.model('Receipt', ReceiptSchema);

export default Receipt;