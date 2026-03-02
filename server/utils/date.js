export const getDayRange = (dateInput) => {
  const current = dateInput
    ? typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)
      ? new Date(`${dateInput}T00:00:00`)
      : new Date(dateInput)
    : new Date();

  if (Number.isNaN(current.getTime())) {
    throw new Error('Invalid date format. Use YYYY-MM-DD.');
  }

  const start = new Date(current);
  start.setHours(0, 0, 0, 0);

  const end = new Date(current);
  end.setHours(23, 59, 59, 999);

  return { start, end, isoDate: start.toISOString().slice(0, 10) };
};

export const getMonthRange = (month, year) => {
  const numericMonth = Number(month);
  const numericYear = Number(year);

  if (!numericMonth || numericMonth < 1 || numericMonth > 12 || !numericYear) {
    throw new Error('Invalid month or year.');
  }

  const start = new Date(numericYear, numericMonth - 1, 1, 0, 0, 0, 0);
  const end = new Date(numericYear, numericMonth, 0, 23, 59, 59, 999);

  return { start, end };
};

export const getDaysInMonth = (month, year) => {
  const numericMonth = Number(month);
  const numericYear = Number(year);

  if (!numericMonth || numericMonth < 1 || numericMonth > 12 || !numericYear) {
    throw new Error('Invalid month or year.');
  }

  return new Date(numericYear, numericMonth, 0).getDate();
};

export const getDaysInMonthFromDate = (dateInput) => {
  const date =
    typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)
      ? new Date(`${dateInput}T00:00:00`)
      : new Date(dateInput);

  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date.');
  }

  return getDaysInMonth(date.getMonth() + 1, date.getFullYear());
};
