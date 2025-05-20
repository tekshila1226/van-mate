import mongoose from 'mongoose';

const childSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required']
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: [true, 'Gender is required']
    },
    schoolName: {
      type: String,
      required: [true, 'School name is required'],
      trim: true
    },
    grade: {
      type: String,
      required: [true, 'Grade is required'],
      trim: true
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Parent/guardian is required']
    },
    routes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route'
    }],
    pickupAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    },
    dropoffAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    },
    emergencyContact: {
      name: String,
      relation: String,
      phone: String
    },
    specialNeeds: {
      has: {
        type: Boolean,
        default: false
      },
      details: String
    },
    medicalInformation: {
      allergies: [String],
      medications: [String],
      notes: String
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    },
    photo: {
      type: String
    },
    attendance: [{
      date: Date,
      status: {
        type: String,
        enum: ['present', 'absent', 'late']
      },
      morningPickup: {
        time: Date,
        status: String,
        notes: String
      },
      afternoonDropoff: {
        time: Date,
        status: String,
        notes: String
      }
    }],
    busAssignment: {
      bus: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bus'
      },
      assignedAt: {
        type: Date
      }
    }
  },
  {
    timestamps: true
  }
);

// Virtual for child's full name
childSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for child's age
childSchema.virtual('age').get(function() {
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Method to check if a child is on a bus
childSchema.methods.isOnBus = async function() {
  const today = new Date();
  const todayAttendance = this.attendance.find(a => {
    const attendanceDate = new Date(a.date);
    return attendanceDate.toDateString() === today.toDateString();
  });
  
  if (!todayAttendance) {
    return false;
  }
  
  // Check morning or afternoon based on time of day
  const currentHour = today.getHours();
  if (currentHour < 12) {
    // Morning
    return todayAttendance.morningPickup && 
           todayAttendance.morningPickup.status === 'picked_up' && 
           !todayAttendance.morningPickup.status === 'dropped_off';
  } else {
    // Afternoon
    return todayAttendance.afternoonDropoff && 
           todayAttendance.afternoonDropoff.status === 'picked_up' && 
           !todayAttendance.afternoonDropoff.status === 'dropped_off';
  }
};

const Child = mongoose.model('Child', childSchema);

export default Child;