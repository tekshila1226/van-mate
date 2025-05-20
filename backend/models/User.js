import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
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
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters']
    },
    phone: {
      type: String,
      validate: {
        validator: function(v) {
          return /\d{10}/.test(v.replace(/\D/g, ''));
        },
        message: 'Please enter a valid phone number'
      }
    },
    role: {
      type: String,
      enum: ['parent', 'driver', 'admin'],
      required: [true, 'Role is required']
    },
    isActive: {
      type: Boolean,
      default: true
    },
    avatar: {
      type: String,
      default: ''
    },
    
    // Parent-specific fields
    address: {
      type: String,
      required: function() {
        return this.role === 'parent';
      }
    },
    children: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Child'
    }],
    
    // Driver-specific fields
    licenseNumber: {
      type: String,
      required: function() {
        return this.role === 'driver';
      }
    },
    busAssigned: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bus',
      // required: function() {
      //   return this.role === 'driver';
      // }
    },
    routes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route'
    }],
    
    // Admin-specific fields
    
    schoolName: {
      type: String,
    },
    department: {
      type: String,
      enum: ['transportation', 'administration', 'security', 'other'],
      required: function() {
        return this.role === 'admin';
      }
    },
    
    // For password reset
    resetPasswordToken: String,
    resetPasswordExpire: Date,

    // Notification preferences
    notificationPreferences: {
      pickup_dropoff: {
        type: Boolean,
        default: true
      },
      delays: {
        type: Boolean,
        default: true
      },
      payment: {
        type: Boolean,
        default: true
      },
      system: {
        type: Boolean,
        default: true
      }
    }
  },
  {
    timestamps: true
  }
);

// Encrypt password using bcrypt
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to get full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

const User = mongoose.model('User', userSchema);

export default User;