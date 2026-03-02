import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const normalizePhone = (value) => String(value || '').replace(/\s+/g, '').trim();

const labourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      set: normalizePhone
    },
    password: {
      type: String,
      minlength: 6,
      default: ''
    },
    profileImage: {
      type: String,
      trim: true,
      default: ''
    },
    section: {
      type: String,
      trim: true,
      default: ''
    },
    labourType: {
      type: String,
      enum: ['salary_based', 'contract_based'],
      default: 'salary_based'
    },
    salaryBasis: {
      type: String,
      enum: ['daily', 'monthly'],
      default: 'daily'
    },
    dailyFixedAmount: {
      type: Number,
      min: 0,
      default: 0
    },
    monthlySalary: {
      type: Number,
      min: 0,
      default: 0
    },
    perPlyRate: {
      type: Number,
      min: 0,
      default: 0
    },
    rate: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

labourSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();

  if (!this.password) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

labourSchema.methods.comparePassword = function comparePassword(plain) {
  if (!this.password) return false;
  return bcrypt.compare(plain, this.password);
};

const Labour = mongoose.model('Labour', labourSchema);
export default Labour;
