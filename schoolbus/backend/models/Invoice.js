import mongoose from 'mongoose';

const InvoiceSchema = new mongoose.Schema({
  // Reference to the parent
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Invoice details
  invoiceNumber: {
    type: String,
    unique: true
  },
  
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  
  status: {
    type: String,
    enum: ['draft', 'pending', 'paid', 'overdue', 'cancelled'],
    default: 'pending'
  },
  
  // Date information
  issueDate: {
    type: Date,
    default: Date.now
  },
  
  dueDate: {
    type: Date,
    required: true
  },
  
  paymentDate: {
    type: Date
  },
  
  // Period this invoice covers
  period: {
    type: String,
    required: true
  },
  
  // Items being billed
  items: [{
    description: String,
    amount: Number,
    quantity: {
      type: Number,
      default: 1
    }
  }],
  
  // Children this invoice applies to
  childrenIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Child'
  }],
  
  // Optional memo/notes
  notes: String,
  
  // Payment reminder details
  reminders: [{
    sentDate: Date,
    method: {
      type: String,
      enum: ['email', 'sms', 'app', 'manual'],
    }
  }]
}, {
  timestamps: true
});

// Auto-generate invoice number on creation
InvoiceSchema.pre('save', async function(next) {
  if (this.isNew && !this.invoiceNumber) {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    
    // Find the highest invoice number for the current year/month
    const lastInvoice = await this.constructor.findOne({
      invoiceNumber: { $regex: `^INV-${currentYear}${currentMonth.toString().padStart(2, '0')}` }
    }).sort({ invoiceNumber: -1 });
    
    let nextNumber = 1;
    if (lastInvoice) {
      // Extract the numeric part and increment
      const parts = lastInvoice.invoiceNumber.split('-');
      if (parts.length >= 2) {
        const lastNumber = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }
    }
    
    // Format: INV-YYYYMM-XXXX
    this.invoiceNumber = `INV-${currentYear}${currentMonth.toString().padStart(2, '0')}-${nextNumber.toString().padStart(4, '0')}`;
  }
  
  next();
});

// Set status to 'overdue' if due date has passed and not paid
InvoiceSchema.pre('save', function(next) {
  if (this.status === 'pending' && this.dueDate < new Date() && !this.paymentDate) {
    this.status = 'overdue';
  }
  next();
});

// Method to calculate total
InvoiceSchema.methods.calculateTotal = function() {
  if (this.items && this.items.length > 0) {
    return this.items.reduce((total, item) => {
      return total + (item.amount * (item.quantity || 1));
    }, 0);
  }
  return this.amount;
};

// Method to mark as paid
InvoiceSchema.methods.markAsPaid = function(paymentDate = new Date()) {
  this.status = 'paid';
  this.paymentDate = paymentDate;
  return this.save();
};

// Static to find invoices due in the next N days
InvoiceSchema.statics.findUpcomingDue = function(days = 7) {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + days);
  
  return this.find({
    status: 'pending',
    dueDate: {
      $gte: today,
      $lte: futureDate
    }
  }).sort({ dueDate: 1 });
};

// Static to find overdue invoices
InvoiceSchema.statics.findOverdue = function() {
  const today = new Date();
  
  return this.find({
    status: 'overdue',
    dueDate: { $lt: today }
  }).sort({ dueDate: 1 });
};

const Invoice = mongoose.model('Invoice', InvoiceSchema);

export default Invoice;