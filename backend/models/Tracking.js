import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  speed: {
    type: Number,
    default: 0
  },
  heading: {
    type: Number,
    default: 0
  }
});

const routePointSchema = new mongoose.Schema({
  time: Date,
  location: String,
  event: String,
  speed: Number,
  coordinates: {
    latitude: Number,
    longitude: Number
  }
});

const trackingSchema = new mongoose.Schema({
  busId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus',
    required: true
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  currentLocation: locationSchema,
  lastStop: {
    name: String,
    time: Date,
    type: {
      type: String,
      enum: ['pickup', 'dropoff', 'school', 'other']
    }
  },
  nextStop: {
    name: String,
    estimatedArrival: Date,
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    distanceInMeters: Number
  },
  dayHistory: [routePointSchema],
  delayMinutes: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['preparing', 'en_route_to_school', 'at_school', 'en_route_to_home', 'completed', 'emergency'],
    default: 'preparing'
  },
  dateActive: {
    type: Date,
    default: Date.now
  },
  connectionInfo: {
    signalStrength: {
      type: String,
      enum: ['weak', 'moderate', 'strong'],
      default: 'strong'
    },
    connectionType: {
      type: String,
      default: '4G'
    },
    batteryLevel: {
      type: Number,
      default: 100
    },
    deviceInfo: {
      type: String
    }
  }
}, { timestamps: true });

const Tracking = mongoose.model('Tracking', trackingSchema);

export default Tracking;