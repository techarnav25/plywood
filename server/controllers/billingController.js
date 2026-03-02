import mongoose from 'mongoose';
import Attendance from '../models/Attendance.js';
import Labour from '../models/Labour.js';
import Payment from '../models/Payment.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { getDaysInMonth, getMonthRange } from '../utils/date.js';

const getLabourCategory = (labour) => labour.labourType || 'salary_based';
const getSalaryBasis = (labour) => labour.salaryBasis || 'daily';

const getDailyFixedAmount = (labour) => {
  const daily = Number(labour.dailyFixedAmount ?? 0);
  if (daily > 0) return daily;
  return Number(labour.rate ?? 0);
};

const getMonthlySalary = (labour) => {
  const monthly = Number(labour.monthlySalary ?? 0);
  if (monthly > 0) return monthly;
  return Number(labour.rate ?? 0);
};

const getPerPlyRate = (labour) => {
  const perPly = Number(labour.perPlyRate ?? 0);
  if (perPly > 0) return perPly;
  return Number(labour.rate ?? 0);
};

const normalizeNumber = (value) => Number(Number(value || 0).toFixed(2));

const mapActor = (actor) => {
  if (!actor) return null;

  if (typeof actor === 'object' && actor._id) {
    return {
      id: actor._id,
      name: actor.name || 'Unknown',
      role: actor.role || ''
    };
  }

  return {
    id: actor,
    name: 'Unknown',
    role: ''
  };
};

const sortByDateDesc = (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime();

const parseMonthYear = (month, year) => {
  const numericMonth = Number(month);
  const numericYear = Number(year);

  if (!numericMonth || numericMonth < 1 || numericMonth > 12 || !numericYear) {
    const error = new Error('Invalid month or year.');
    error.statusCode = 400;
    throw error;
  }

  return { month: numericMonth, year: numericYear };
};

const parseEntryDate = ({ date, month, year }) => {
  const parsed = date ? new Date(`${date}T00:00:00`) : new Date(year, month - 1, 1);

  if (Number.isNaN(parsed.getTime())) {
    const error = new Error('Invalid date format. Use YYYY-MM-DD.');
    error.statusCode = 400;
    throw error;
  }

  if (parsed.getMonth() + 1 !== month || parsed.getFullYear() !== year) {
    const error = new Error('Entry date must be in selected month and year.');
    error.statusCode = 400;
    throw error;
  }

  const normalized = new Date(parsed);
  normalized.setHours(0, 0, 0, 0);

  return normalized;
};

const ensureLabour = async (labourId) => {
  if (!mongoose.Types.ObjectId.isValid(labourId)) {
    const error = new Error('Invalid labourId.');
    error.statusCode = 400;
    throw error;
  }

  const labour = await Labour.findById(labourId);

  if (!labour) {
    const error = new Error('Labour not found.');
    error.statusCode = 404;
    throw error;
  }

  return labour;
};

const ensurePaymentDoc = async ({ labourId, month, year }) => {
  let payment = await Payment.findOne({ labourId, month, year });

  if (!payment) {
    payment = await Payment.create({
      labourId,
      month,
      year
    });
  }

  return payment;
};

const calculateAdjustmentData = ({ payment, labourType, effectiveDailyRate, perPlyRate }) => {
  const canteenEntries = payment?.canteenEntries || [];
  const advanceEntries = payment?.advanceEntries || [];
  const extraEntries = payment?.extraEntries || [];

  const legacyCut = Number(payment?.cut || 0);
  const legacyAdvance = Number(payment?.advance || 0);

  const canteenFromEntries = canteenEntries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
  const advanceFromEntries = advanceEntries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);

  let extraHoursTotal = 0;
  let extraPlyTotal = 0;
  let extraAmount = 0;

  extraEntries.forEach((entry) => {
    const qty = Number(entry.quantity || 0);

    if (entry.type === 'hours') {
      extraHoursTotal += qty;

      if (labourType === 'salary_based') {
        extraAmount += (qty / 10) * effectiveDailyRate;
      }
    }

    if (entry.type === 'ply') {
      extraPlyTotal += qty;

      if (labourType === 'contract_based') {
        extraAmount += qty * perPlyRate;
      }
    }
  });

  const mappedCanteen = canteenEntries
    .map((entry) => ({
      id: entry._id,
      amount: normalizeNumber(entry.amount),
      date: entry.date,
      addedBy: mapActor(entry.addedBy)
    }))
    .sort(sortByDateDesc);

  const mappedAdvance = advanceEntries
    .map((entry) => ({
      id: entry._id,
      amount: normalizeNumber(entry.amount),
      date: entry.date,
      givenBy: mapActor(entry.givenBy)
    }))
    .sort(sortByDateDesc);

  const mappedExtra = extraEntries
    .map((entry) => ({
      id: entry._id,
      type: entry.type,
      quantity: normalizeNumber(entry.quantity),
      date: entry.date,
      note: entry.note || '',
      addedBy: mapActor(entry.addedBy)
    }))
    .sort(sortByDateDesc);

  return {
    canteenTotal: normalizeNumber(canteenFromEntries + legacyCut),
    advanceTotal: normalizeNumber(advanceFromEntries + legacyAdvance),
    extraHoursTotal: normalizeNumber(extraHoursTotal),
    extraPlyTotal: normalizeNumber(extraPlyTotal),
    extraAmount: normalizeNumber(extraAmount),
    canteenEntries: mappedCanteen,
    advanceEntries: mappedAdvance,
    extraEntries: mappedExtra
  };
};

const buildBillingSummary = async ({ labourId, month, year }) => {
  const labour = await ensureLabour(labourId);
  const { start, end } = getMonthRange(month, year);
  const monthDays = getDaysInMonth(month, year);

  const aggregation = await Attendance.aggregate([
    {
      $match: {
        labourId: labour._id,
        date: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: null,
        totalDays: { $sum: 1 },
        totalPresentDays: {
          $sum: {
            $cond: [{ $eq: ['$status', 'present'] }, 1, 0]
          }
        },
        totalHours: { $sum: '$hours' },
        totalAttendanceUnits: { $sum: '$hajri' },
        totalPly: { $sum: '$ply' }
      }
    }
  ]);

  const monthly = aggregation[0] || {
    totalDays: 0,
    totalPresentDays: 0,
    totalHours: 0,
    totalAttendanceUnits: 0,
    totalPly: 0
  };

  const attendanceLogs = await Attendance.find({
    labourId: labour._id,
    date: { $gte: start, $lte: end }
  })
    .select('date ply status')
    .sort({ date: -1 })
    .lean();

  const payment = await Payment.findOne({ labourId: labour._id, month: Number(month), year: Number(year) })
    .populate('canteenEntries.addedBy', 'name role')
    .populate('advanceEntries.givenBy', 'name role')
    .populate('extraEntries.addedBy', 'name role');

  const labourType = getLabourCategory(labour);
  const salaryBasis = getSalaryBasis(labour);
  const dailyFixedAmount = getDailyFixedAmount(labour);
  const monthlySalary = getMonthlySalary(labour);
  const perPlyRate = getPerPlyRate(labour);
  const effectiveDailyRate =
    labourType === 'salary_based' && salaryBasis === 'monthly'
      ? normalizeNumber(monthlySalary / monthDays)
      : dailyFixedAmount;

  const grossAmount =
    labourType === 'contract_based'
      ? normalizeNumber(monthly.totalPly * perPlyRate)
      : normalizeNumber(monthly.totalAttendanceUnits * effectiveDailyRate);

  const adjustmentData = calculateAdjustmentData({
    payment,
    labourType,
    effectiveDailyRate,
    perPlyRate
  });

  const netAmount = normalizeNumber(
    grossAmount + adjustmentData.extraAmount - adjustmentData.canteenTotal - adjustmentData.advanceTotal
  );
  const finalPayable = netAmount < 0 ? 0 : netAmount;
  const duesOnLabour = netAmount < 0 ? normalizeNumber(Math.abs(netAmount)) : 0;

  return {
    labour: {
      id: labour._id,
      name: labour.name,
      phone: labour.phone,
      profileImage: labour.profileImage || '',
      section: labour.section || '',
      labourType,
      salaryBasis,
      dailyFixedAmount,
      monthlySalary,
      perPlyRate
    },
    month: Number(month),
    year: Number(year),
    monthDays,
    effectiveDailyRate,
    totalDays: monthly.totalDays,
    totalPresentDays: monthly.totalPresentDays,
    totalHours: normalizeNumber(monthly.totalHours || 0),
    totalAttendanceUnits: normalizeNumber(monthly.totalAttendanceUnits || 0),
    totalPly: monthly.totalPly,
    dailyPlyLogs: attendanceLogs.map((entry) => ({
      date: entry.date,
      ply: normalizeNumber(entry.ply || 0),
      status: entry.status
    })),
    grossAmount,
    canteenTotal: adjustmentData.canteenTotal,
    advanceTotal: adjustmentData.advanceTotal,
    extraHoursTotal: adjustmentData.extraHoursTotal,
    extraPlyTotal: adjustmentData.extraPlyTotal,
    extraAmount: adjustmentData.extraAmount,
    canteenEntries: adjustmentData.canteenEntries,
    advanceEntries: adjustmentData.advanceEntries,
    extraEntries: adjustmentData.extraEntries,
    cut: adjustmentData.canteenTotal,
    advance: adjustmentData.advanceTotal,
    netAmount,
    duesOnLabour,
    finalPayable
  };
};

export const getLabourMonthlyBilling = async (req, res) => {
  const today = new Date();
  const month = req.query.month || today.getMonth() + 1;
  const year = req.query.year || today.getFullYear();

  const summary = await buildBillingSummary({
    labourId: req.params.id,
    month,
    year
  });

  return sendSuccess(res, summary, 'Billing summary fetched successfully');
};

export const getMyMonthlyBilling = async (req, res) => {
  const today = new Date();
  const month = req.query.month || today.getMonth() + 1;
  const year = req.query.year || today.getFullYear();

  const summary = await buildBillingSummary({
    labourId: req.user._id,
    month,
    year
  });

  return sendSuccess(res, summary, 'Billing summary fetched successfully');
};

export const upsertPayment = async (req, res) => {
  const { month, year, cut = 0, advance = 0 } = req.body;
  const { month: numericMonth, year: numericYear } = parseMonthYear(month, year);

  if (Number(cut) < 0 || Number(advance) < 0) {
    const error = new Error('cut and advance must be non-negative.');
    error.statusCode = 400;
    throw error;
  }

  const labour = await ensureLabour(req.params.id);

  await Payment.findOneAndUpdate(
    { labourId: labour._id, month: numericMonth, year: numericYear },
    {
      labourId: labour._id,
      month: numericMonth,
      year: numericYear,
      cut: Number(cut),
      advance: Number(advance),
      updatedBy: req.user._id
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    }
  );

  const summary = await buildBillingSummary({
    labourId: labour._id,
    month: numericMonth,
    year: numericYear
  });

  return sendSuccess(res, summary, 'Payment details updated successfully');
};

export const addCanteenEntry = async (req, res) => {
  const { month, year, amount, date } = req.body;
  const { month: numericMonth, year: numericYear } = parseMonthYear(month, year);

  const parsedAmount = Number(amount);
  if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
    const error = new Error('Amount must be greater than 0.');
    error.statusCode = 400;
    throw error;
  }

  const labour = await ensureLabour(req.params.id);
  const entryDate = parseEntryDate({ date, month: numericMonth, year: numericYear });

  const payment = await ensurePaymentDoc({
    labourId: labour._id,
    month: numericMonth,
    year: numericYear
  });

  payment.canteenEntries.push({
    amount: parsedAmount,
    date: entryDate,
    addedBy: req.user._id
  });
  payment.updatedBy = req.user._id;
  await payment.save();

  const summary = await buildBillingSummary({
    labourId: labour._id,
    month: numericMonth,
    year: numericYear
  });

  return sendSuccess(res, summary, 'Canteen entry added successfully');
};

export const addAdvanceEntry = async (req, res) => {
  const { month, year, amount, date } = req.body;
  const { month: numericMonth, year: numericYear } = parseMonthYear(month, year);

  const parsedAmount = Number(amount);
  if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
    const error = new Error('Amount must be greater than 0.');
    error.statusCode = 400;
    throw error;
  }

  const labour = await ensureLabour(req.params.id);
  const entryDate = parseEntryDate({ date, month: numericMonth, year: numericYear });

  const payment = await ensurePaymentDoc({
    labourId: labour._id,
    month: numericMonth,
    year: numericYear
  });

  payment.advanceEntries.push({
    amount: parsedAmount,
    date: entryDate,
    givenBy: req.user._id
  });
  payment.updatedBy = req.user._id;
  await payment.save();

  const summary = await buildBillingSummary({
    labourId: labour._id,
    month: numericMonth,
    year: numericYear
  });

  return sendSuccess(res, summary, 'Advance entry added successfully');
};

export const addExtraEntry = async (req, res) => {
  const { month, year, quantity, date, note = '' } = req.body;
  const { month: numericMonth, year: numericYear } = parseMonthYear(month, year);

  const parsedQuantity = Number(quantity);
  if (Number.isNaN(parsedQuantity) || parsedQuantity <= 0) {
    const error = new Error('Quantity must be greater than 0.');
    error.statusCode = 400;
    throw error;
  }

  const labour = await ensureLabour(req.params.id);
  const labourType = getLabourCategory(labour);
  const entryType = labourType === 'contract_based' ? 'ply' : 'hours';
  const entryDate = parseEntryDate({ date, month: numericMonth, year: numericYear });

  const payment = await ensurePaymentDoc({
    labourId: labour._id,
    month: numericMonth,
    year: numericYear
  });

  payment.extraEntries.push({
    type: entryType,
    quantity: parsedQuantity,
    date: entryDate,
    note: note?.trim() || '',
    addedBy: req.user._id
  });
  payment.updatedBy = req.user._id;
  await payment.save();

  const summary = await buildBillingSummary({
    labourId: labour._id,
    month: numericMonth,
    year: numericYear
  });

  return sendSuccess(res, summary, 'Extra entry added successfully');
};
