import mongoose from 'mongoose';

const RecordingSchema = new mongoose.Schema({
  meetingId: {
    type: String,
    required: true,
    index: true,
  },
  recordingUrl: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Recording || mongoose.model('Recording', RecordingSchema);
