import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['pickup', 'dropoff', 'payment', 'delay', 'system', 'other'],
      default: 'other'
    },
    isRead: {
      type: Boolean,
      default: false
    },
    relatedTo: {
      childId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Child'
      },
      routeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Route'
      },
      busId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bus'
      },
      paymentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment'
      }
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('Notification', notificationSchema);