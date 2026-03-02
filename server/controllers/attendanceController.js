import mongoose from 'mongoose';
import Attendance from '../models/Attendance.js';
import Labour from '../models/Labour.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { getDayRange, getDaysInMonthFromDate } from '../utils/date.js';

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

const calculateSalaryAttendanceUnit = (hours) => {
  return Number((Number(hours || 0) / 10).toFixed(2));
};

const getSalaryDailyRate = (labour, dateInput) => {
  if (getSalaryBasis(labour) === 'monthly') {
    const monthDays = getDaysInMonthFromDate(dateInput);
    return Number((getMonthlySalary(labour) / monthDays).toFixed(2));
  }

  return Number(getDailyFixedAmount(labour).toFixed(2));
};

const calculateDayAmount = ({ labour, status, ply, hajri, attendanceDate }) => {
  const labourType = getLabourCategory(labour);

  if (status === 'absent') return 0;

  if (labourType === 'salary_based') {
    const dailyRate = getSalaryDailyRate(labour, attendanceDate);
    return Number((dailyRate * Number(hajri || 0)).toFixed(2));
  }

  return Number((Number(ply || 0) * getPerPlyRate(labour)).toFixed(2));
};

export const getDailyAttendance = async (req, res) => {
  const { date, search = '', status } = req.query;
  const { start, end, isoDate } = getDayRange(date);

  const labourQuery = search
    ? {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { section: { $regex: search, $options: 'i' } }
        ]
      }
    : {};

  const labours = await Labour.find(labourQuery).sort({ name: 1 }).lean();
  const labourIds = labours.map((item) => item._id);

  const attendances = await Attendance.find({
    labourId: { $in: labourIds },
    date: { $gte: start, $lte: end }
  }).lean();

  const attendanceMap = new Map(attendances.map((item) => [item.labourId.toString(), item]));

  let rows = labours.map((labour) => {
    const record = attendanceMap.get(labour._id.toString());

    return {
      labourId: labour._id,
      labourName: labour.name,
      phone: labour.phone,
      section: labour.section || '',
      labourType: getLabourCategory(labour),
      salaryBasis: getSalaryBasis(labour),
      rate: Number(labour.rate ?? 0),
      dailyFixedAmount: getDailyFixedAmount(labour),
      monthlySalary: getMonthlySalary(labour),
      perPlyRate: getPerPlyRate(labour),
      salaryDailyRate: getSalaryDailyRate(labour, start),
      date: isoDate,
      status: record?.status || null,
      hours: record?.hours ?? 0,
      attendanceUnit: record?.hajri ?? 0,
      ply: record?.ply ?? 0,
      dayAmount: calculateDayAmount({
        labour,
        status: record?.status || 'absent',
        ply: record?.ply ?? 0,
        hajri: record?.hajri ?? 0,
        attendanceDate: record?.date || start
      }),
      isSubmitted: Boolean(record?.isLocked),
      attendanceId: record?._id || null
    };
  });

  if (status === 'present' || status === 'absent') {
    rows = rows.filter((row) => row.status === status);
  }

  return sendSuccess(
    res,
    {
      date: isoDate,
      rows
    },
    'Daily attendance fetched successfully'
  );
};

export const submitAttendance = async (req, res) => {
  const { labourId, date, status, hours = 0, ply = 0 } = req.body;

  if (!labourId || !status) {
    const error = new Error('labourId and status are required.');
    error.statusCode = 400;
    throw error;
  }

  if (!['present', 'absent'].includes(status)) {
    const error = new Error('Status must be present or absent.');
    error.statusCode = 400;
    throw error;
  }

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

  const { start, end } = getDayRange(date);

  const existing = await Attendance.findOne({
    labourId,
    date: { $gte: start, $lte: end }
  });

  if (existing?.isLocked) {
    const error = new Error('Attendance is already submitted and locked for this labour and date.');
    error.statusCode = 409;
    throw error;
  }

  const labourType = getLabourCategory(labour);
  const parsedHours = Number(hours || 0);
  const parsedPly = Number(ply || 0);

  if (Number.isNaN(parsedHours) || parsedHours < 0) {
    const error = new Error('Hours must be a non-negative number.');
    error.statusCode = 400;
    throw error;
  }

  if (parsedPly < 0 || Number.isNaN(parsedPly)) {
    const error = new Error('Ply must be a non-negative number.');
    error.statusCode = 400;
    throw error;
  }

  if (labourType === 'salary_based' && status === 'present' && parsedHours > 10) {
    const error = new Error('Hours for salary-based labour must be between 0 and 10.');
    error.statusCode = 400;
    throw error;
  }

  if (labourType === 'salary_based' && status === 'present' && parsedHours === 0) {
    const error = new Error('Hours are required for salary-based labour.');
    error.statusCode = 400;
    throw error;
  }

  const finalPly = status === 'absent' || labourType === 'salary_based' ? 0 : parsedPly;
  const finalHours = labourType === 'salary_based' && status === 'present' ? parsedHours : 0;
  const finalHajri =
    labourType === 'salary_based' && status === 'present' ? calculateSalaryAttendanceUnit(parsedHours) : 0;

  const attendance = await Attendance.create({
    labourId,
    date: start,
    status,
    hours: finalHours,
    hajri: finalHajri,
    ply: finalPly,
    isLocked: true,
    submittedBy: req.user._id
  });

  return sendSuccess(res, attendance, 'Attendance submitted successfully', 201);
};

export const getDailySummary = async (req, res) => {
  const { date } = req.query;
  const { start, end, isoDate } = getDayRange(date);
  const summaryMonthDays = getDaysInMonthFromDate(start);

  const summary = await Attendance.aggregate([
    {
      $match: {
        date: { $gte: start, $lte: end }
      }
    },
    {
      $lookup: {
        from: 'labours',
        localField: 'labourId',
        foreignField: '_id',
        as: 'labour'
      }
    },
    { $unwind: '$labour' },
    {
      $group: {
        _id: null,
        totalPresent: {
          $sum: {
            $cond: [{ $eq: ['$status', 'present'] }, 1, 0]
          }
        },
        totalAbsent: {
          $sum: {
            $cond: [{ $eq: ['$status', 'absent'] }, 1, 0]
          }
        },
        totalPlyToday: { $sum: '$ply' },
        estimatedExpenseToday: {
          $sum: {
            $cond: [
              { $eq: ['$labour.labourType', 'contract_based'] },
              { $multiply: ['$ply', { $ifNull: ['$labour.perPlyRate', '$labour.rate'] }] },
              {
                $multiply: [
                  '$hajri',
                  {
                    $cond: [
                      { $eq: [{ $ifNull: ['$labour.salaryBasis', 'daily'] }, 'monthly'] },
                      { $divide: [{ $ifNull: ['$labour.monthlySalary', '$labour.rate'] }, summaryMonthDays] },
                      { $ifNull: ['$labour.dailyFixedAmount', '$labour.rate'] }
                    ]
                  }
                ]
              }
            ]
          }
        }
      }
    }
  ]);

  const data = summary[0] || {
    totalPresent: 0,
    totalAbsent: 0,
    totalPlyToday: 0,
    estimatedExpenseToday: 0
  };

  data.estimatedExpenseToday = Number((data.estimatedExpenseToday || 0).toFixed(2));

  return sendSuccess(
    res,
    {
      date: isoDate,
      ...data
    },
    'Daily summary fetched successfully'
  );
};
