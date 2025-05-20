import mongoose from 'mongoose';

const stopSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Stop name is required']
  },
  address: {
    type: String,
    required: [true, 'Address is required']
  },
  coordinates: {
    latitude: {
      type: Number,
      required: [true, 'Latitude is required']
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required']
    }
  },
  arrivalTime: {
    type: String,
    required: [true, 'Arrival time is required']
  },
  departureTime: {
    type: String,
    required: [true, 'Departure time is required']
  },
  sequence: {
    type: Number,
    required: [true, 'Sequence number is required']
  }
});

const routeSchema = new mongoose.Schema(
  {
    routeNumber: {
      type: String,
      required: [true, 'Route number is required'],
      unique: true,
      trim: true
    },
    name: {
      type: String,
      required: [true, 'Route name is required'],
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    type: {
      type: String,
      enum: ['morning', 'afternoon', 'special'],
    },
    buses: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bus',
      required: [true, 'Bus is required for a route']
    }],
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    school: {
      type: String,
      required: [true, 'School name is required']
    },
    stops: [stopSchema],
    daysOfOperation: {
      monday: { type: Boolean, default: true },
      tuesday: { type: Boolean, default: true },
      wednesday: { type: Boolean, default: true },
      thursday: { type: Boolean, default: true },
      friday: { type: Boolean, default: true },
      saturday: { type: Boolean, default: false },
      sunday: { type: Boolean, default: false }
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    endDate: {
      type: Date
    },
    isActive: {
      type: Boolean,
      default: true
    },
    totalDistance: {
      type: Number,
      min: [0, 'Distance cannot be negative']
    },
    estimatedDuration: {
      type: Number, // in minutes
      min: [1, 'Duration must be at least 1 minute']
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual field for students assigned to this route
routeSchema.virtual('students', {
  ref: 'Child',
  localField: '_id',
  foreignField: 'route'
});

const Route = mongoose.model('Route', routeSchema);

export default Route;