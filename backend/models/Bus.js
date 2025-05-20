import mongoose from 'mongoose';

const busSchema = new mongoose.Schema(
  {
    busNumber: {
      type: String,
      required: [true, 'Bus number is required'],
      unique: true,
      trim: true
    },
    licensePlate: {
      type: String,
      required: [true, 'License plate number is required'],
      unique: true,
      trim: true
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: [1, 'Capacity must be at least 1']
    },
    make: {
      type: String,
      required: [true, 'Vehicle make is required'],
      trim: true
    },
    model: {
      type: String,
      required: [true, 'Vehicle model is required'],
      trim: true
    },
    year: {
      type: Number,
      required: [true, 'Vehicle year is required']
    },
    status: {
      type: String,
      enum: ['active', 'maintenance', 'inactive'],
      default: 'active'
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    lastMaintenance: {
      type: Date
    },
    nextMaintenance: {
      type: Date
    },
    features: [{
      type: String
    }],
    gpsDevice: {
      deviceId: String,
      lastUpdated: Date,
      isActive: {
        type: Boolean,
        default: true
      }
    },
    fuelType: {
      type: String,
      enum: ['diesel', 'gasoline', 'electric', 'hybrid'],
      default: 'diesel'
    },
    fuelCapacity: {
      type: Number
    },
    currentFuelLevel: {
      type: Number
    },
    assignedStudents: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Child'
    }]
  },
  {
    timestamps: true
  }
);

// Virtual for current route
busSchema.virtual('currentRoute', {
  ref: 'Route',
  localField: '_id',
  foreignField: 'bus'
});

const Bus = mongoose.model('Bus', busSchema);

export default Bus;