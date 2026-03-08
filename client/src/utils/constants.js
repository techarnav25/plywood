export const ADMIN_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  LABOUR: 'labour'
};

export const LABOUR_TYPES = {
  SALARY_BASED: 'salary_based',
  CONTRACT_BASED: 'contract_based'
};

export const SALARY_BASIS = {
  DAILY: 'daily',
  MONTHLY: 'monthly'
};

export const LABOUR_TYPE_OPTIONS = [
  {
    value: LABOUR_TYPES.SALARY_BASED,
    label: 'Salary Based'
  },
  {
    value: LABOUR_TYPES.CONTRACT_BASED,
    label: 'Contract Based'
  }
];

export const SALARY_BASIS_OPTIONS = [
  {
    value: SALARY_BASIS.DAILY,
    label: 'Daily'
  },
  {
    value: SALARY_BASIS.MONTHLY,
    label: 'Monthly'
  }
];

export const MONTH_OPTIONS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' }
];
