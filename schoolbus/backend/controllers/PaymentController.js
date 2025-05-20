import Payment from '../models/Payment.js';
import User from '../models/User.js';
import Child from '../models/Child.js';
import Invoice from '../models/Invoice.js';
import Receipt from '../models/Receipt.js';
import Route from '../models/Route.js'; // Import Route model
import mongoose from 'mongoose';
import Stripe from 'stripe';

// Initialize Stripe with your API key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Get all invoices for a parent
export async function getParentInvoices(req, res) {
  try {
    const parentId = req.user._id;

    const invoices = await Invoice.find({
      parentId,
      status: { $in: ['pending', 'overdue'] }
    }).sort({ dueDate: 1 });

    res.status(200).json({
      success: true,
      data: invoices
    });
  } catch (error) {
    console.error('Get parent invoices error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}

// Get invoice details
export async function getInvoiceDetails(req, res) {
  try {
    const { invoiceId } = req.params;
    const parentId = req.user._id;

    // Validate invoiceId
    if (!invoiceId || invoiceId === "undefined") {
      return res.status(400).json({
        success: false,
        message: 'Invalid invoice ID provided'
      });
    }

    // Validate that invoiceId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid invoice ID format'
      });
    }

    const invoice = await Invoice.findOne({
      _id: invoiceId,
      parentId
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Get children details
    const children = await Child.find({
      parent: parentId
    }).select('firstName lastName route');

    // Format response with child details
    const childDetails = children.map(child => ({
      name: `${child.firstName} ${child.lastName}`,
      busRoute: `Route #${child.route?.routeNumber || 'N/A'}`,
      fee: invoice.amount / children.length
    }));

    res.status(200).json({
      success: true,
      invoiceId: invoice._id,
      amount: invoice.amount,
      dueDate: invoice.dueDate,
      period: invoice.period,
      children: childDetails,
      status: invoice.status
    });
  } catch (error) {
    console.error('Get invoice details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}

// Process credit card payment
export async function processCardPayment(req, res) {
  try {
    const { invoiceId, paymentMethodId, amount } = req.body;
    const parentId = req.user._id;

    // Verify invoice
    const invoice = await Invoice.findOne({
      _id: invoiceId,
      parentId
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      payment_method: paymentMethodId,
      confirm: true,
      description: `Payment for Invoice #${invoice._id}`, // Using invoice._id for clarity
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never', // Instruct Stripe not to redirect
      },
    });

    if (paymentIntent.status === 'succeeded') {
      // Update invoice status
      invoice.status = 'paid';
      invoice.paymentDate = new Date();
      await invoice.save();

      // Create payment record
      const payment = await Payment.create({
        amount,
        paymentMethod: 'credit_card',
        status: 'completed',
        transactionId: paymentIntent.id,
        description: `Payment for Invoice #${invoice._id}`, // Consistent description
        parentId,
        invoiceId: invoice._id, // Ensure this is the MongoDB ObjectId
        childrenIds: invoice.childrenIds 
      });

      // Create receipt
      const receipt = await Receipt.create({
        invoiceId: invoice._id,
        parentId,
        amount,
        paymentMethod: 'credit_card',
        transactionId: paymentIntent.id,
        paymentGateway: 'stripe',
        paymentDate: new Date()
      });

      res.status(200).json({
        success: true,
        message: 'Payment processed successfully',
        receiptId: receipt._id
      });
    } else {
      // If not 'succeeded' (e.g., 'requires_payment_method' because redirect was disallowed but needed, or other failure)
      // The specific message from Stripe is often in last_payment_error
      const errorMessage = paymentIntent.last_payment_error?.message || 'Payment processing failed or requires action not permitted.';
      res.status(400).json({
        success: false,
        message: errorMessage
      });
    }
  } catch (error) {
    console.error('Process card payment error:', error);
    // Provide more specific Stripe error messages if available
    let errorMessage = 'Payment processing failed';
    if (error.type === 'StripeCardError') {
      errorMessage = error.message;
    } else if (error.type && error.message) { // Broader Stripe errors
        errorMessage = error.message;
    } else if (error.message) {
        errorMessage = error.message;
    }
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
}

// Create PayPal order
export async function createPaypalOrder(req, res) {
  try {
    const { invoiceId, amount } = req.body;
    const parentId = req.user._id;

    // Verify invoice
    const invoice = await Invoice.findOne({
      _id: invoiceId,
      parentId
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Here you'd integrate with PayPal SDK
    // For demonstration, returning a mock orderId
    res.status(200).json({
      success: true,
      orderId: 'MOCK-PAYPAL-ORDER-ID'
    });

  } catch (error) {
    console.error('Create PayPal order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create PayPal order'
    });
  }
}

// Capture PayPal payment
export async function capturePaypalOrder(req, res) {
  try {
    const { invoiceId, orderId } = req.body;
    const parentId = req.user._id;

    // Verify invoice
    const invoice = await Invoice.findOne({
      _id: invoiceId,
      parentId
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Here you'd integrate with PayPal SDK to capture payment
    // For demonstration, we'll just update the status

    // Update invoice status
    invoice.status = 'paid';
    invoice.paymentDate = new Date();
    await invoice.save();

    // Create receipt
    const receipt = await Receipt.create({
      invoiceId: invoice._id,
      parentId,
      amount: invoice.amount,
      paymentMethod: 'paypal',
      transactionId: orderId,
      paymentDate: new Date()
    });

    res.status(200).json({
      success: true,
      message: 'PayPal payment captured successfully',
      receiptId: receipt._id
    });
  } catch (error) {
    console.error('Capture PayPal order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to capture PayPal payment'
    });
  }
}

// Get parent payment status
export async function getParentPaymentStatus(req, res) {
  try {
    const driverId = req.user._id;

    // Get routes assigned to this driver
    const driverRoutes = await Route.find({ driver: driverId }).select('_id name');
    if (!driverRoutes.length) {
      return res.status(200).json({
        success: true,
        total: 0,
        paid: 0,
        pending: 0,
        overdue: 0,
        recentActivity: []
      });
    }
    
    const routeIds = driverRoutes.map(route => route._id);

    // Find all children on these routes
    const childrenOnRoutes = await Child.find({ 
      $or: [
        { routes: { $in: routeIds } },
        { route: { $in: routeIds } }
      ]
    })
    .populate('parent', 'firstName lastName')
    .select('_id firstName lastName parent');

    // Track found children IDs
    const childIdsOnRoutes = childrenOnRoutes.map(c => c._id.toString());

    console.log(`Found ${childIdsOnRoutes.length} children on driver's routes`);
    
    // Get all invoices (not limited to children yet)
    // We'll filter later to check which ones are for children on driver's routes
    const allInvoices = await Invoice.find()
      .sort({ issueDate: -1 })
      .limit(50)  // Get more invoices to ensure we have enough after filtering
      .populate('parentId', 'firstName lastName')
      .populate({
        path: 'childrenIds',
        select: 'firstName lastName',
        model: 'Child'
      });
    
    console.log(`Found ${allInvoices.length} total invoices`);

    // Filter invoices to only those that contain children on driver's routes
    const relevantInvoices = allInvoices.filter(invoice => {
      // Check if any child ID in this invoice is also in our childIdsOnRoutes
      return invoice.childrenIds.some(child => 
        // Compare as strings to avoid object reference issues
        childIdsOnRoutes.includes(child._id.toString())
      );
    });
    
    console.log(`Found ${relevantInvoices.length} invoices relevant to driver's routes`);

    // Count payment statuses
    let paidCount = 0;
    let pendingCount = 0;
    let overdueCount = 0;

    // Count each status
    relevantInvoices.forEach(invoice => {
      if (invoice.status === 'paid') paidCount++;
      else if (invoice.status === 'pending') pendingCount++;
      else if (invoice.status === 'overdue') overdueCount++;
    });

    // Format recent payment activity
    const recentActivity = [];
    
    for (const invoice of relevantInvoices) {
      // For each child on this invoice
      for (const child of invoice.childrenIds) {
        // Check if this child is on driver's routes
        if (childIdsOnRoutes.includes(child._id.toString())) {
          // Find the specific item amount for this child, or approximate
          let childAmount = 0;
          
          if (invoice.items && invoice.items.length > 0) {
            // Try to find a matching line item
            const itemForChild = invoice.items.find(
              item => item.description.includes(child.firstName) ||
                    item.description.toLowerCase().includes('transportation')
            );
            
            childAmount = itemForChild 
              ? itemForChild.amount 
              : (invoice.amount / invoice.childrenIds.length);
          } else {
            // If no line items, divide total by number of children
            childAmount = invoice.amount / invoice.childrenIds.length;
          }

          recentActivity.push({
            parent: invoice.parentId 
              ? `${invoice.parentId.firstName} ${invoice.parentId.lastName}` 
              : 'Unknown Parent',
            student: `${child.firstName} ${child.lastName}`,
            date: invoice.issueDate 
              ? new Date(invoice.issueDate).toLocaleDateString() 
              : 'Unknown Date',
            amount: parseFloat(childAmount.toFixed(2)),
            status: invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)
          });
        }
      }
    }

    // Limit recent activity to 5 entries and sort by date
    const finalActivity = recentActivity
      .slice(0, 5)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(200).json({
      success: true,
      total: childrenOnRoutes.length,
      paid: paidCount,
      pending: pendingCount,
      overdue: overdueCount,
      recentActivity: finalActivity
    });
  } catch (error) {
    console.error('Get parent payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
}

// Get driver salary data
export async function getDriverSalary(req, res) {
  try {
    const driverId = req.user._id;
    const { month } = req.query;
    
    // Get driver's information including salary details
    const driver = await User.findById(driverId).select('salary paymentDetails');
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }
    
    // Get payment history for the driver for this month
    const [year, monthNum] = month ? month.split(' ') : [new Date().getFullYear(), new Date().toLocaleString('default', { month: 'long' })];
    const monthIndex = new Date(`${monthNum} 1, ${year}`).getMonth();
    
    const startDate = new Date(parseInt(year), monthIndex, 1);
    const endDate = new Date(parseInt(year), monthIndex + 1, 0);
    
    // Calculate upcoming payment date
    const nextPaymentDate = new Date(parseInt(year), monthIndex, 28);
    if (nextPaymentDate < new Date()) {
      nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
    }
    
    // Get all payments for this driver in the period
    const payments = await Payment.find({
      driverId,
      paymentDate: { $gte: startDate, $lte: endDate }
    }).sort({ paymentDate: -1 });
    
    // Get all route data to calculate income
    const routes = await Route.find({ driver: driverId });
    const routeIds = routes.map(route => route._id);
    
    // Count students on routes to calculate income
    const studentCount = await Child.countDocuments({ 
      $or: [
        { routes: { $in: routeIds } },
        { route: { $in: routeIds } }
      ]
    });
    
    // Base calculation of gross amount - can be customized based on your business model
    const ratePerStudent = 45; // This could come from a settings collection
    const routeIncome = studentCount * ratePerStudent;
    
    // Calculate deductions - this would come from your business rules
    const taxRate = 0.15; // Example tax rate
    const insuranceRate = 0.06; // Example insurance rate
    const retirementRate = 0.075; // Example retirement contribution rate
    
    const incomeTax = routeIncome * taxRate;
    const insurance = routeIncome * insuranceRate;
    const retirement = routeIncome * retirementRate;
    const totalDeductions = incomeTax + insurance + retirement;
    
    // Find bonuses from payments
    const bonuses = payments
      .filter(payment => payment.metadata && payment.metadata.get('type') === 'bonus')
      .map(payment => ({
        description: payment.description || 'Performance Bonus',
        amount: payment.amount,
        date: payment.paymentDate.toLocaleDateString()
      }));
    
    res.status(200).json({
      success: true,
      grossAmount: routeIncome,
      netAmount: routeIncome - totalDeductions,
      nextPaymentDate: nextPaymentDate.toLocaleDateString(),
      paymentMethod: driver.paymentDetails?.method || 'Direct Deposit',
      accountEnding: driver.paymentDetails?.accountNumber 
        ? `****${driver.paymentDetails.accountNumber.slice(-4)}` 
        : '****0000',
      deductions: {
        incomeTax,
        insurance,
        retirement
      },
      totalDeductions,
      bonuses
    });
  } catch (error) {
    console.error('Get driver salary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
}

// Get driver payment history
export async function getDriverPaymentHistory(req, res) {
  try {
    const driverId = req.user._id;
    
    // Get all payments for this driver
    const paymentRecords = await Payment.find({
      driverId
    }).sort({ paymentDate: -1 }).limit(12); // Get last 12 payments
    
    const payments = paymentRecords.map(payment => {
      // Extract month and year for the period
      const payDate = new Date(payment.paymentDate);
      const period = `${payDate.toLocaleString('default', { month: 'long' })} ${payDate.getFullYear()}`;
      
      // Calculate gross and net from payment record
      // This would depend on your payment structure
      const grossAmount = payment.amount + (payment.taxes || 0);
      
      return {
        id: payment._id,
        period,
        payDate: payDate.toLocaleDateString(),
        grossAmount,
        netAmount: payment.amount,
        status: payment.status === 'completed' ? 'Paid' : payment.status
      };
    });

    res.status(200).json({
      success: true,
      payments
    });
  } catch (error) {
    console.error('Get driver payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
}

// Get route income data
export async function getRouteIncome(req, res) {
  try {
    const driverId = req.user._id;
    const { month } = req.query;
    
    // Get all routes for this driver
    const routes = await Route.find({ driver: driverId });
    if (!routes.length) {
      return res.status(200).json({
        success: true,
        totalStudents: 0,
        ratePerStudent: 0,
        totalIncome: 0,
        routes: [],
        notes: 'No active routes found'
      });
    }
    
    const routeIds = routes.map(route => route._id);
    
    // Get student count per route
    const routeDetails = await Promise.all(routes.map(async route => {
      const studentCount = await Child.countDocuments({
        $or: [
          { routes: route._id },
          { route: route._id }
        ]
      });
      
      // Calculate income for this route
      const ratePerStudent = 45; // This could come from settings
      const total = studentCount * ratePerStudent;
      
      return {
        name: route.name || `Route #${route.routeNumber}`,
        students: studentCount,
        ratePerStudent,
        total
      };
    }));
    
    // Calculate totals across all routes
    const totalStudents = routeDetails.reduce((sum, route) => sum + route.students, 0);
    const totalIncome = routeDetails.reduce((sum, route) => sum + route.total, 0);
    const ratePerStudent = totalStudents > 0 ? (totalIncome / totalStudents).toFixed(2) : 0;

    res.status(200).json({
      success: true,
      totalStudents,
      ratePerStudent,
      totalIncome,
      routes: routeDetails,
      notes: 'Income calculated based on the number of students assigned to each route'
    });
  } catch (error) {
    console.error('Get route income error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
}

// Get children on driver's routes for invoicing
export async function getDriverRouteChildren(req, res) {
  try {
    const driverId = req.user._id;
    
    // Get routes assigned to this driver
    const routes = await Route.find({ driver: driverId });
    
    if (!routes.length) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }
    
    const routeIds = routes.map(route => route._id);
    
    // Find all children on these routes with their parent info
    // Changed from route to routes
    const children = await Child.find({ 
      $or: [
        { routes: { $in: routeIds } },  // Look for children with any of these routes in their routes array
        { route: { $in: routeIds } }    // Backward compatibility for any records using old schema
      ]
    })
    .populate('parent', 'firstName lastName')
    .populate('routes', 'name');  // Populate the routes array instead of route
    
    // Get recent invoice/payment data for each child
    const childrenWithPaymentInfo = await Promise.all(children.map(async child => {
      // Find most recent invoice for this child
      const recentInvoice = await Invoice.findOne({
        childrenIds: child._id
      }).sort({ createdAt: -1 });
      
      // Find the first matching route from this driver's routes (for display purposes)
      const firstRoute = child.routes && child.routes.length > 0 
        ? child.routes.find(r => routeIds.includes(r._id.toString())) 
        : null;

      return {
        _id: child._id,
        firstName: child.firstName,
        lastName: child.lastName,
        grade: child.grade,
        parentName: child.parent ? `${child.parent.firstName} ${child.parent.lastName}` : null,
        parentId: child.parent?._id,
        // Use the first matching route for display
        routeName: firstRoute?.name || 'Unknown Route',
        routeId: firstRoute?._id || null,
        // Include all route IDs for reference
        routeIds: child.routes ? child.routes.map(r => r._id) : [],
        lastInvoice: recentInvoice ? {
          id: recentInvoice._id,
          amount: recentInvoice.amount,
          date: recentInvoice.issueDate,
          status: recentInvoice.status
        } : null,
        paymentStatus: recentInvoice?.status
      };
    }));
    
    res.status(200).json({
      success: true,
      data: childrenWithPaymentInfo
    });
  } catch (error) {
    console.error('Get driver route children error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}

// Generate invoice for selected children
export async function generateInvoice(req, res) {
  try {
    const driverId = req.user._id;
    const { childrenIds, amount, dueDate, period, notes } = req.body;
    
    if (!childrenIds || !childrenIds.length) {
      return res.status(400).json({
        success: false,
        message: 'No children selected'
      });
    }
    
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }
    
    if (!dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Due date is required'
      });
    }
    
    if (!period) {
      return res.status(400).json({
        success: false,
        message: 'Invoice period is required'
      });
    }
    
    // Verify that these children are on the driver's routes
    const routes = await Route.find({ driver: driverId });
    const routeIds = routes.map(route => route._id);
    
    const eligibleChildren = await Child.find({
      _id: { $in: childrenIds },
      routes: { $in: routeIds }
    }).populate('parent');
    
    if (!eligibleChildren.length) {
      return res.status(400).json({
        success: false,
        message: 'No eligible children found'
      });
    }
    
    // Group children by parent
    const parentMap = {};
    eligibleChildren.forEach(child => {
      if (!child.parent) return;
      
      const parentId = child.parent._id.toString();
      if (!parentMap[parentId]) {
        parentMap[parentId] = {
          parent: child.parent,
          children: []
        };
      }
      parentMap[parentId].children.push(child);
    });
    
    // Create an invoice for each parent
    const invoicePromises = Object.values(parentMap).map(async ({ parent, children }) => {
      const childrenIds = children.map(child => child._id);
      
      // Calculate amount per child (this could be more complex based on your requirements)
      const totalAmount = amount * children.length;
      
      const invoice = new Invoice({
        parentId: parent._id,
        amount: totalAmount,
        dueDate: new Date(dueDate),
        period,
        childrenIds,
        notes,
        items: children.map(child => ({
          description: `Transportation for ${child.firstName} ${child.lastName}`,
          amount,
          quantity: 1
        }))
      });
      
      await invoice.save();
      return invoice;
    });
    
    const invoices = await Promise.all(invoicePromises);
    
    res.status(201).json({
      success: true,
      message: `${invoices.length} invoices generated successfully`,
      invoices
    });
  } catch (error) {
    console.error('Generate invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}