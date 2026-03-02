import Labour from '../models/Labour.js';
import Attendance from '../models/Attendance.js';
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

  return {
    canteenTotal: normalizeNumber(canteenFromEntries + legacyCut),
    advanceTotal: normalizeNumber(advanceFromEntries + legacyAdvance),
    extraHoursTotal: normalizeNumber(extraHoursTotal),
    extraPlyTotal: normalizeNumber(extraPlyTotal),
    extraAmount: normalizeNumber(extraAmount)
  };
};

export const getMonthlyReport = async (req, res) => {
  const today = new Date();
  const month = Number(req.query.month || today.getMonth() + 1);
  const year = Number(req.query.year || today.getFullYear());
  const monthDays = getDaysInMonth(month, year);

  const { start, end } = getMonthRange(month, year);

  const labours = await Labour.find().sort({ name: 1 }).lean();

  const rows = await Promise.all(
    labours.map(async (labour) => {
      const [attendanceSummary] = await Attendance.aggregate([
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

      const payment = await Payment.findOne({ labourId: labour._id, month, year }).lean();

      const totalDays = attendanceSummary?.totalDays || 0;
      const totalPresentDays = attendanceSummary?.totalPresentDays || 0;
      const totalHours = normalizeNumber(attendanceSummary?.totalHours || 0);
      const totalAttendanceUnits = normalizeNumber(attendanceSummary?.totalAttendanceUnits || 0);
      const totalPly = attendanceSummary?.totalPly || 0;

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
          ? normalizeNumber(totalPly * perPlyRate)
          : normalizeNumber(totalAttendanceUnits * effectiveDailyRate);

      const adjustments = calculateAdjustmentData({
        payment,
        labourType,
        effectiveDailyRate,
        perPlyRate
      });

      const netAmount = normalizeNumber(
        grossAmount + adjustments.extraAmount - adjustments.canteenTotal - adjustments.advanceTotal
      );
      const finalPayable = netAmount < 0 ? 0 : netAmount;
      const duesOnLabour = netAmount < 0 ? normalizeNumber(Math.abs(netAmount)) : 0;

      return {
        labourId: labour._id,
        labourName: labour.name,
        section: labour.section || '',
        labourType,
        salaryBasis,
        dailyFixedAmount,
        monthlySalary,
        perPlyRate,
        monthDays,
        effectiveDailyRate,
        totalDays,
        totalPresentDays,
        totalHours,
        totalAttendanceUnits,
        totalPly,
        grossAmount,
        canteenTotal: adjustments.canteenTotal,
        advanceTotal: adjustments.advanceTotal,
        extraHoursTotal: adjustments.extraHoursTotal,
        extraPlyTotal: adjustments.extraPlyTotal,
        extraAmount: adjustments.extraAmount,
        cut: adjustments.canteenTotal,
        advance: adjustments.advanceTotal,
        netAmount,
        duesOnLabour,
        finalPayable
      };
    })
  );

  return sendSuccess(
    res,
    {
      month,
      year,
      rows
    },
    'Monthly report fetched successfully'
  );
};
