import mongoose from 'mongoose';

const MeetingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a meeting title'],
  },
  description: {
    type: String,
    default: '',
  },
  meetingId: {
    type: String,
    required: [true, 'Please provide a meeting ID'],
    unique: true,
    uppercase: true,
  },
  startTime: {
    type: Date,
    required: [true, 'Please provide a start time'],
  },
  status: {
    type: String,
    enum: ['scheduled', 'active', 'ended'],
    default: 'scheduled',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  screenShareUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  screenShareRequests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
}, { timestamps: true });

export default mongoose.models.Meeting || mongoose.model('Meeting', MeetingSchema);
