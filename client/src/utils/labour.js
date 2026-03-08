import { LABOUR_TYPES, SALARY_BASIS } from './constants.js';

export const normalizeLabourType = (labourType) => labourType || LABOUR_TYPES.SALARY_BASED;

export const normalizeSalaryBasis = (salaryBasis) => salaryBasis || SALARY_BASIS.DAILY;

export const getLabourTypeLabel = (labourType) =>
  normalizeLabourType(labourType) === LABOUR_TYPES.CONTRACT_BASED ? 'Contract Based' : 'Salary Based';

export const getSalaryBasisLabel = (salaryBasis) =>
  normalizeSalaryBasis(salaryBasis) === SALARY_BASIS.MONTHLY ? 'Monthly' : 'Daily';

export const getMonthDaysFromDate = (dateInput) => {
  const date = dateInput
    ? dateInput instanceof Date
      ? new Date(dateInput)
      : new Date(`${dateInput}T00:00:00`)
    : new Date();
  const year = date.getFullYear();
  const month = date.getMonth();
  return new Date(year, month + 1, 0).getDate();
};

export const getEffectiveSalaryDailyRate = ({ salaryBasis, dailyFixedAmount, monthlySalary, rate, date }) => {
  if (normalizeSalaryBasis(salaryBasis) === SALARY_BASIS.MONTHLY) {
    const monthDays = getMonthDaysFromDate(date);
    return Number((Number(monthlySalary || rate || 0) / monthDays).toFixed(2));
  }

  return Number(Number(dailyFixedAmount || rate || 0).toFixed(2));
};

export const getLabourRateLabel = (labour) => {
  const labourType = normalizeLabourType(labour.labourType);

  if (labourType === LABOUR_TYPES.CONTRACT_BASED) return 'Per Ply Rate';
  if (normalizeSalaryBasis(labour.salaryBasis) === SALARY_BASIS.MONTHLY) return 'Monthly Salary';

  return 'Daily Salary';
};

export const getLabourRateValue = (labour) => {
  const labourType = normalizeLabourType(labour.labourType);
  const rateFallback = Number(labour.rate ?? 0);

  if (labourType === LABOUR_TYPES.CONTRACT_BASED) {
    const perPly = Number(labour.perPlyRate ?? 0);
    return perPly > 0 ? perPly : rateFallback;
  }

  if (normalizeSalaryBasis(labour.salaryBasis) === SALARY_BASIS.MONTHLY) {
    const monthly = Number(labour.monthlySalary ?? 0);
    return monthly > 0 ? monthly : rateFallback;
  }

  const daily = Number(labour.dailyFixedAmount ?? 0);
  return daily > 0 ? daily : rateFallback;
};

export const calculateSalaryAttendanceUnit = (hours) => Number((Number(hours || 0) / 10).toFixed(2));

export const calculateDashboardDayAmount = ({
  labourType,
  salaryBasis,
  status,
  hours,
  ply,
  dailyFixedAmount,
  monthlySalary,
  rate,
  perPlyRate,
  date
}) => {
  const type = normalizeLabourType(labourType);

  if (status === 'absent') return 0;

  if (type === LABOUR_TYPES.CONTRACT_BASED) {
    return Number((Number(ply || 0) * Number(perPlyRate || 0)).toFixed(2));
  }

  const attendanceUnit = calculateSalaryAttendanceUnit(hours);
  const dailyRate = getEffectiveSalaryDailyRate({
    salaryBasis,
    dailyFixedAmount,
    monthlySalary,
    rate,
    date
  });

  return Number((dailyRate * attendanceUnit).toFixed(2));
};
