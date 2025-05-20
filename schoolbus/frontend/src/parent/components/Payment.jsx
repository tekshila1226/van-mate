import React, { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { toast } from 'react-hot-toast'
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { PayPalButton } from 'react-paypal-button-v2'
import StripeConfig from '../../utils/StripeConfig'
import { 
  useGetInvoiceDetailsQuery,
  useProcessCardPaymentMutation,
  useCreatePaypalOrderMutation,
  useCapturePaypalOrderMutation
} from '../../redux/features/paymentSlice'
import Spinner from './Spinner'

function PaymentForm() {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState('creditCard');
  const [cardName, setCardName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardError, setCardError] = useState(null);
  
  // Skip fetching if invoiceId is not valid
  const skipQuery = !invoiceId || invoiceId === 'undefined';
  
  // RTK Query hooks
  const { data: paymentDetails, isLoading, error } = useGetInvoiceDetailsQuery(
    invoiceId, 
    { skip: skipQuery }
  );
  
  const [processCardPayment] = useProcessCardPaymentMutation();
  const [createPaypalOrder] = useCreatePaypalOrderMutation();
  const [capturePaypalOrder] = useCapturePaypalOrderMutation();
  
  // If no valid invoiceId, redirect to invoices list
  useEffect(() => {
    if (skipQuery) {
      navigate('/parent/payments');
    }
  }, [skipQuery, navigate]);
  
  // Stripe hooks
  const stripe = useStripe();
  const elements = useElements();
  
  const handleCardSubmit = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }
    
    setIsProcessing(true);
    setCardError(null);
    
    const cardElement = elements.getElement(CardElement);
    
    try {
      // Create payment method
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: cardName
        }
      });
      
      if (error) {
        setCardError(error.message);
        setIsProcessing(false);
        return;
      }
      
      // Process payment
      const result = await processCardPayment({
        invoiceId,
        paymentMethodId: paymentMethod.id,
        amount: paymentDetails.amount
      }).unwrap();
      
      toast.success('Payment processed successfully!');
      // navigate('/parent/payments/receipt/' + result.receiptId);
    } catch (err) {
      toast.error('Payment failed: ' + (err.data?.message || 'Unknown error'));
    } finally {
      setIsProcessing(false);
    }
  };
  
  // PayPal handlers
  const createPayPalOrder = async () => {
    try {
      const result = await createPaypalOrder({
        invoiceId,
        amount: paymentDetails.amount
      }).unwrap();
      
      return result.orderId;
    } catch (err) {
      toast.error('Failed to create PayPal order');
      return null;
    }
  };
  
  const onPayPalApprove = async (data) => {
    setIsProcessing(true);
    
    try {
      const result = await capturePaypalOrder({
        invoiceId,
        orderId: data.orderID
      }).unwrap();
      
      toast.success('Payment processed successfully!');
      navigate('/parent/payments/receipt/' + result.receiptId);
    } catch (err) {
      toast.error('Payment capture failed: ' + (err.data?.message || 'Unknown error'));
    } finally {
      setIsProcessing(false);
    }
  };
  
  if (isLoading) {
    return <Spinner />;
  }
  
  if (error) {
    return (
      <div className="md:p-20 bg-red-50 text-red-700 rounded-lg">
        Error loading payment details: {error.data?.message || 'Unknown error'}
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-4 md:p-6 md:pt-20"
    >
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Payment Summary */}
          <div className="md:col-span-1 order-2 md:order-1">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 sticky top-24">
              <div className="p-5">
                <h3 className="font-semibold text-gray-800 mb-4">Payment Summary</h3>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Invoice ID:</span>
                    <span className="font-medium">{paymentDetails.invoiceId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Due Date:</span>
                    <span className="font-medium">{paymentDetails.dueDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Period:</span>
                    <span className="font-medium">{paymentDetails.period}</span>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-4 mb-4">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Service Details</h4>
                  {paymentDetails.children.map((child, index) => (
                    <div key={index} className="flex justify-between mb-2 text-sm">
                      <span>{child.name} ({child.busRoute})</span>
                      <span>Rs.{child.fee.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                
                <div className="border-t border-gray-200 pt-4 mb-4">
                  <div className="flex justify-between font-semibold">
                    <span>Total Amount:</span>
                    <span>Rs.{paymentDetails.amount.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 -mx-5 -mb-5 mt-6">
                  <div className="text-center text-sm text-gray-600">
                    <p>Need help with your payment?</p>
                    <Link to="/parent/support" className="text-indigo-600 hover:text-indigo-800 font-medium">
                      Contact support
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Payment Form */}
          <div className="md:col-span-2 order-1 md:order-2">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
              <div className="p-4 md:p-5">
                <h3 className="font-semibold text-gray-800 mb-4">Payment Method</h3>
                
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <button 
                    className={`flex-1 p-4 border rounded-lg ${paymentMethod === 'creditCard' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200'}`}
                    onClick={() => setPaymentMethod('creditCard')}
                  >
                    <div className="flex items-center">
                      <input 
                        type="radio" 
                        checked={paymentMethod === 'creditCard'} 
                        onChange={() => setPaymentMethod('creditCard')} 
                        className="mr-3 h-4 w-4 text-indigo-600" 
                      />
                      <div>
                        <p className="font-medium text-gray-800">Credit / Debit Card</p>
                        <div className="flex mt-1 space-x-2">
                          <svg className="h-6 w-8" viewBox="0 0 40 24" fill="none">
                            <rect width="40" height="24" rx="4" fill="#E7E9EC"/>
                            <path fillRule="evenodd" clipRule="evenodd" d="M15.5152 17.0522H12.4848L10.5455 9.14775C10.4605 8.80543 10.2803 8.50444 10.0332 8.29391C9.28788 7.74141 8.45455 7.28023 7.53033 6.94775V6.70456H12.2803C12.9495 6.70456 13.4545 7.18891 13.5455 7.78023L14.4242 13.4711L16.697 6.70456H19.5909L15.5152 17.0522ZM20.8636 17.0522H18.0606L20.3788 6.70456H23.1818L20.8636 17.0522ZM25.7576 9.86647C25.8485 9.26647 26.3535 8.9098 26.9394 8.9098C27.8182 8.82316 28.7879 9.02499 29.5758 9.50934L30.0303 7.04142C29.2424 6.70895 28.3636 6.54159 27.5758 6.54159C24.9697 6.54159 23.0303 7.95026 23.0303 9.92982C23.0303 11.4271 24.3333 12.1855 25.303 12.6189C26.2727 13.0523 26.6667 13.3189 26.5758 13.7523C26.5758 14.418 25.8485 14.7271 25.1212 14.7271C24.1515 14.7271 23.1818 14.418 22.3939 13.9189L21.9394 16.386C22.8182 16.8189 23.7879 16.9855 24.697 16.9855C27.5758 16.9855 29.4242 15.5855 29.4242 13.4814C29.4242 10.8189 25.7576 10.6855 25.7576 9.86647ZM36.4545 17.0522L34.1818 6.70456H31.6667C31.1212 6.70456 30.6163 7.02835 30.4545 7.53086L26.3787 17.0522H29.2728L29.8182 15.4948H33.3333L33.6364 17.0522H36.4545ZM32.0303 9.14775L32.8182 13.2836H30.5L32.0303 9.14775Z" fill="#1A1A1A"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </button>
                  
                  <button 
                    className={`flex-1 p-4 border rounded-lg ${paymentMethod === 'paypal' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200'}`}
                    onClick={() => setPaymentMethod('paypal')}
                  >
                    <div className="flex items-center">
                      <input 
                        type="radio" 
                        checked={paymentMethod === 'paypal'} 
                        onChange={() => setPaymentMethod('paypal')} 
                        className="mr-3 h-4 w-4 text-indigo-600" 
                      />
                      <div>
                        <p className="font-medium text-gray-800">PayPal</p>
                        <p className="text-xs text-gray-500">Pay with your PayPal account</p>
                      </div>
                    </div>
                  </button>
                </div>
                
                {paymentMethod === 'creditCard' ? (
                  <form onSubmit={handleCardSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label htmlFor="cardName" className="block text-sm font-medium text-gray-700 mb-1">
                          Cardholder Name
                        </label>
                        <input
                          id="cardName"
                          type="text"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
                          placeholder="John Smith"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Card Details
                        </label>
                        <div className="border border-gray-300 rounded-lg p-3">
                          <CardElement 
                            options={{
                              style: {
                                base: {
                                  fontSize: '16px',
                                  color: '#424770',
                                  '::placeholder': {
                                    color: '#aab7c4',
                                  },
                                },
                                invalid: {
                                  color: '#9e2146',
                                },
                              },
                            }}
                          />
                        </div>
                      </div>
                      
                      {cardError && (
                        <div className="text-red-500 text-sm">{cardError}</div>
                      )}
                    </div>
                    
                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={isProcessing || !stripe}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-medium transition duration-300 flex justify-center items-center disabled:bg-indigo-300"
                      >
                        {isProcessing ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing Payment...
                          </>
                        ) : `Pay Rs.${paymentDetails.amount.toFixed(2)}`}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="text-center p-6">
                    <p className="mb-4 text-gray-600">Complete your payment with PayPal.</p>
                    <div className="px-8">
                      <PayPalButton
                        createOrder={createPayPalOrder}
                        onApprove={onPayPalApprove}
                        onError={() => toast.error("PayPal payment failed")}
                        options={{
                          clientId: "YOUR_PAYPAL_CLIENT_ID",
                          currency: "USD",
                          disableFunding: "card"
                        }}
                      />
                    </div>
                  </div>
                )}
                
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-500">Your payment is secure and encrypted.</p>
                  <div className="flex justify-center mt-2 space-x-3">
                    <svg className="h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 10C9 9.44772 9.44772 9 10 9H14C14.5523 9 15 9.44772 15 10V15C15 15.5523 14.5523 16 14 16H10C9.44772 16 9 15.5523 9 15V10Z" fill="#4F46E5"/>
                      <path d="M19 6C19 4.89543 18.1046 4 17 4H7C5.89543 4 5 4.89543 5 6V18C5 19.1046 5.89543 20 7 20H17C18.1046 20 19 19.1046 19 18V6Z" stroke="#4F46E5" strokeWidth="2"/>
                      <path d="M15 9V6.5C15 5.11929 13.8807 4 12.5 4H12H11.5C10.1193 4 9 5.11929 9 6.5V9" stroke="#4F46E5" strokeWidth="2"/>
                    </svg>
                    <svg className="h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M16.5 10.5V8C16.5 5.51472 14.4853 3.5 12 3.5C9.51472 3.5 7.5 5.51472 7.5 8V10.5" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round"/>
                      <rect x="5" y="10.5" width="14" height="10" rx="2" stroke="#4F46E5" strokeWidth="2"/>
                      <circle cx="12" cy="15.5" r="1.5" fill="#4F46E5"/>
                      <path d="M12 17V19" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <svg className="h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 10.5L11 12.5L15.5 8" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" stroke="#4F46E5" strokeWidth="2"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Wrap the component with Stripe configuration
export default function Payment() {
  return (
    <StripeConfig>
      <PaymentForm />
    </StripeConfig>
  );
}