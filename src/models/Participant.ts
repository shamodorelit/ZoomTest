import mongoose from 'mongoose';

const ParticipantSchema = new mongoose.Schema({
  meetingId: {
    type: String,
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
  leftAt: {
    type: Date,
    default: null,
  },
});

export default mongoose.models.Participant || mongoose.model('Participant', ParticipantSchema);
