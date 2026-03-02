import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    labourId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Labour',
      required: true
    },
    date: {
      type: Date,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['present', 'absent'],
      required: true
    },
    hours: {
      type: Number,
      required: true,
      min: 0,
      max: 24,
      default: 0
    },
    hajri: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    ply: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    isLocked: {
      type: Boolean,
      default: true
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true
    }
  },
  {
    timestamps: true
  }
);

attendanceSchema.index({ labourId: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;
