import mongoose from 'mongoose';

const canteenEntrySchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    date: {
      type: Date,
      required: true
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true
    }
  },
  {
    _id: true,
    timestamps: true
  }
);

const advanceEntrySchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    date: {
      type: Date,
      required: true
    },
    givenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true
    }
  },
  {
    _id: true,
    timestamps: true
  }
);

const extraEntrySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['hours', 'ply'],
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    date: {
      type: Date,
      required: true
    },
    note: {
      type: String,
      trim: true,
      default: ''
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true
    }
  },
  {
    _id: true,
    timestamps: true
  }
);

const paymentSchema = new mongoose.Schema(
  {
    labourId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Labour',
      required: true
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },
    year: {
      type: Number,
      required: true
    },
    cut: {
      type: Number,
      default: 0,
      min: 0
    },
    advance: {
      type: Number,
      default: 0,
      min: 0
    },
    canteenEntries: {
      type: [canteenEntrySchema],
      default: []
    },
    advanceEntries: {
      type: [advanceEntrySchema],
      default: []
    },
    extraEntries: {
      type: [extraEntrySchema],
      default: []
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    }
  },
  {
    timestamps: true
  }
);

paymentSchema.index({ labourId: 1, month: 1, year: 1 }, { unique: true });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
