import Labour from '../models/Labour.js';
import { sendSuccess } from '../utils/apiResponse.js';

const VALID_TYPES = ['salary_based', 'contract_based'];
const VALID_SALARY_BASIS = ['daily', 'monthly'];
const normalizePhone = (value) => String(value || '').replace(/\s+/g, '').trim();

const sanitizeLabour = (labourDoc) => {
  const labour = labourDoc?.toObject ? labourDoc.toObject() : { ...labourDoc };
  delete labour.password;
  return labour;
};

const parseRatePayload = ({ labourType, salaryBasis, dailyFixedAmount, monthlySalary, perPlyRate, rate }) => {
  const normalizedType = labourType || 'salary_based';

  if (!VALID_TYPES.includes(normalizedType)) {
    const error = new Error('Invalid labourType. Use salary_based or contract_based.');
    error.statusCode = 400;
    throw error;
  }

  const normalizedSalaryBasis = normalizedType === 'salary_based' ? salaryBasis || 'daily' : 'daily';

  if (normalizedType === 'salary_based' && !VALID_SALARY_BASIS.includes(normalizedSalaryBasis)) {
    const error = new Error('Invalid salaryBasis. Use daily or monthly.');
    error.statusCode = 400;
    throw error;
  }

  const salaryDailyInput =
    dailyFixedAmount ?? (normalizedType === 'salary_based' && normalizedSalaryBasis === 'daily' ? rate : 0);
  const salaryMonthlyInput =
    monthlySalary ?? (normalizedType === 'salary_based' && normalizedSalaryBasis === 'monthly' ? rate : 0);
  const contractInput = perPlyRate ?? (normalizedType === 'contract_based' ? rate : 0);

  const parsedDailyFixedAmount = Number(salaryDailyInput || 0);
  const parsedMonthlySalary = Number(salaryMonthlyInput || 0);
  const parsedPerPlyRate = Number(contractInput || 0);

  if (Number.isNaN(parsedDailyFixedAmount) || parsedDailyFixedAmount < 0) {
    const error = new Error('dailyFixedAmount must be a non-negative number.');
    error.statusCode = 400;
    throw error;
  }

  if (Number.isNaN(parsedPerPlyRate) || parsedPerPlyRate < 0) {
    const error = new Error('perPlyRate must be a non-negative number.');
    error.statusCode = 400;
    throw error;
  }

  if (Number.isNaN(parsedMonthlySalary) || parsedMonthlySalary < 0) {
    const error = new Error('monthlySalary must be a non-negative number.');
    error.statusCode = 400;
    throw error;
  }

  if (normalizedType === 'salary_based' && normalizedSalaryBasis === 'daily' && parsedDailyFixedAmount <= 0) {
    const error = new Error('dailyFixedAmount is required when salaryBasis is daily.');
    error.statusCode = 400;
    throw error;
  }

  if (normalizedType === 'salary_based' && normalizedSalaryBasis === 'monthly' && parsedMonthlySalary <= 0) {
    const error = new Error('monthlySalary is required when salaryBasis is monthly.');
    error.statusCode = 400;
    throw error;
  }

  if (normalizedType === 'contract_based' && parsedPerPlyRate <= 0) {
    const error = new Error('perPlyRate is required for contract_based labour.');
    error.statusCode = 400;
    throw error;
  }

  const normalizedRate =
    normalizedType === 'contract_based'
      ? parsedPerPlyRate
      : normalizedSalaryBasis === 'monthly'
        ? parsedMonthlySalary
        : parsedDailyFixedAmount;

  return {
    labourType: normalizedType,
    salaryBasis: normalizedType === 'salary_based' ? normalizedSalaryBasis : 'daily',
    dailyFixedAmount:
      normalizedType === 'salary_based' && normalizedSalaryBasis === 'daily' ? parsedDailyFixedAmount : 0,
    monthlySalary:
      normalizedType === 'salary_based' && normalizedSalaryBasis === 'monthly' ? parsedMonthlySalary : 0,
    perPlyRate: normalizedType === 'contract_based' ? parsedPerPlyRate : 0,
    rate: normalizedRate
  };
};

export const createLabour = async (req, res) => {
  const { name, phone, section, password, labourType, salaryBasis, dailyFixedAmount, monthlySalary, perPlyRate, rate } =
    req.body;

  if (!name || !phone) {
    const error = new Error('Name and phone are required.');
    error.statusCode = 400;
    throw error;
  }

  if (!password || String(password).trim().length < 6) {
    const error = new Error('Labour password is required (minimum 6 characters).');
    error.statusCode = 400;
    throw error;
  }

  const parsedRates = parseRatePayload({
    labourType,
    salaryBasis,
    dailyFixedAmount,
    monthlySalary,
    perPlyRate,
    rate
  });

  const normalizedPhone = normalizePhone(phone);
  const existingByPhone = await Labour.findOne({ phone: normalizedPhone });

  if (existingByPhone) {
    const error = new Error('Labour already exists with this mobile number.');
    error.statusCode = 409;
    throw error;
  }

  const labour = await Labour.create({
    name: name.trim(),
    phone: normalizedPhone,
    section: String(section || '').trim(),
    password: String(password).trim(),
    ...parsedRates
  });

  return sendSuccess(res, sanitizeLabour(labour), 'Labour added successfully', 201);
};

export const getLabours = async (req, res) => {
  const { search = '' } = req.query;

  const query = search
    ? {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { section: { $regex: search, $options: 'i' } }
        ]
      }
    : {};

  const labours = await Labour.find(query).sort({ name: 1 }).select('-password');
  return sendSuccess(res, labours, 'Labours fetched successfully');
};

export const getLabourById = async (req, res) => {
  const labour = await Labour.findById(req.params.id).select('-password');

  if (!labour) {
    const error = new Error('Labour not found.');
    error.statusCode = 404;
    throw error;
  }

  return sendSuccess(res, labour, 'Labour fetched successfully');
};

export const updateLabour = async (req, res) => {
  const { name, phone, section, password, labourType, salaryBasis, dailyFixedAmount, monthlySalary, perPlyRate, rate } =
    req.body;

  const labour = await Labour.findById(req.params.id);

  if (!labour) {
    const error = new Error('Labour not found.');
    error.statusCode = 404;
    throw error;
  }

  const parsedRates = parseRatePayload({
    labourType: labourType || labour.labourType,
    salaryBasis: salaryBasis || labour.salaryBasis,
    dailyFixedAmount: dailyFixedAmount !== undefined ? dailyFixedAmount : labour.dailyFixedAmount,
    monthlySalary: monthlySalary !== undefined ? monthlySalary : labour.monthlySalary,
    perPlyRate: perPlyRate !== undefined ? perPlyRate : labour.perPlyRate,
    rate: rate !== undefined ? rate : labour.rate
  });

  labour.name = name?.trim() ?? labour.name;
  if (section !== undefined) {
    labour.section = String(section || '').trim();
  }
  if (phone !== undefined) {
    const normalizedPhone = normalizePhone(phone);

    if (normalizedPhone && normalizedPhone !== labour.phone) {
      const existingByPhone = await Labour.findOne({
        phone: normalizedPhone,
        _id: { $ne: labour._id }
      });

      if (existingByPhone) {
        const error = new Error('Labour already exists with this mobile number.');
        error.statusCode = 409;
        throw error;
      }

      labour.phone = normalizedPhone;
    }
  }
  labour.labourType = parsedRates.labourType;
  labour.salaryBasis = parsedRates.salaryBasis;
  labour.dailyFixedAmount = parsedRates.dailyFixedAmount;
  labour.monthlySalary = parsedRates.monthlySalary;
  labour.perPlyRate = parsedRates.perPlyRate;
  labour.rate = parsedRates.rate;

  if (password !== undefined) {
    const normalizedPassword = String(password).trim();

    if (normalizedPassword) {
      if (normalizedPassword.length < 6) {
        const error = new Error('Labour password must be at least 6 characters.');
        error.statusCode = 400;
        throw error;
      }

      labour.password = normalizedPassword;
    }
  }

  const updated = await labour.save();

  return sendSuccess(res, sanitizeLabour(updated), 'Labour updated successfully');
};

export const deleteLabour = async (req, res) => {
  const labour = await Labour.findById(req.params.id);

  if (!labour) {
    const error = new Error('Labour not found.');
    error.statusCode = 404;
    throw error;
  }

  await labour.deleteOne();

  return sendSuccess(res, null, 'Labour deleted successfully');
};
