import React from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

// Replace with your actual Stripe publishable key
const stripePromise = loadStripe('pk_test_51RQWL3KrchWMv163kajUtv0p2MHueuVdLbnRPWn47vLusyGz0QpWvO1f0dKyNYwDqxMBBhJ4b5nxRMYcUAZFWnB300ZgDLnVku');

export default function StripeConfig({ children }) {

  const options = {
    fonts: [
      {
        cssSrc: 'https://fonts.googleapis.com/css?family=Roboto:400,500,700'
      }
    ],
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#6366f1',
        colorBackground: '#ffffff',
        colorText: '#1f2937',
        colorDanger: '#ef4444',
        fontFamily: 'Roboto, sans-serif',
        borderRadius: '8px'
      }
    }
  };
  
  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
}