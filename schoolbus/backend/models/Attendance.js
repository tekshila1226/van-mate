import mongoose from 'mongoose';

const AttendanceSchema = new mongoose.Schema({
  child: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Child',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Late'],
    default: 'Present'
  },
  morningPickup: {
    type: Boolean,
    default: true
  },
  afternoonDropoff: {
    type: Boolean,
    default: true
  },
  pickupTime: {
    type: String
  },
  dropoffTime: {
    type: String
  },
  pickupLocation: {
    type: String,
    default: 'Home'
  },
  dropoffLocation: {
    type: String,
    default: 'Home'
  },
  notes: {
    type: String
  },
  driverNotes: {
    type: String
  },
  returnDate: {
    type: Date
  }
}, {
  timestamps: true
});

const Attendance = mongoose.model('Attendance', AttendanceSchema);

export default Attendance;