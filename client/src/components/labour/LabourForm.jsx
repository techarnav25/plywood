import { useEffect, useState } from 'react';
import { BriefcaseBusiness, CalendarDays, Layers3, Wallet } from 'lucide-react';
import Button from '../common/Button.jsx';
import Input from '../common/Input.jsx';
import {
  LABOUR_TYPE_OPTIONS,
  LABOUR_TYPES,
  SALARY_BASIS,
  SALARY_BASIS_OPTIONS
} from '../../utils/constants.js';

const initialState = {
  name: '',
  phone: '',
  section: '',
  password: '',
  labourType: LABOUR_TYPES.SALARY_BASED,
  salaryBasis: SALARY_BASIS.DAILY,
  dailyFixedAmount: '',
  monthlySalary: '',
  perPlyRate: ''
};

const labourTypeMeta = {
  [LABOUR_TYPES.SALARY_BASED]: {
    icon: Wallet,
    description: 'Fixed pay based on attendance and hours.'
  },
  [LABOUR_TYPES.CONTRACT_BASED]: {
    icon: Layers3,
    description: 'Payment based on finished ply.'
  }
};

const salaryBasisMeta = {
  [SALARY_BASIS.DAILY]: {
    icon: CalendarDays,
    description: '10 hours = 1 attendance unit.'
  },
  [SALARY_BASIS.MONTHLY]: {
    icon: BriefcaseBusiness,
    description: 'Monthly salary auto-converted to daily rate.'
  }
};

function SelectTile({ active, icon: Icon, label, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border px-3 py-3 text-left transition ${
        active
          ? 'border-primary-300 bg-primary-50 text-primary-800 dark:border-primary-700 dark:bg-primary-900/25 dark:text-primary-200'
          : 'border-slate-200 bg-white hover:border-primary-200 hover:bg-primary-50/60 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-primary-800 dark:hover:bg-primary-900/15'
      }`}
    >
      <div className="flex items-start gap-2">
        <span
          className={`mt-0.5 rounded-lg p-1.5 ${
            active
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/35 dark:text-primary-200'
              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'
          }`}
        >
          <Icon className="h-4 w-4" />
        </span>
        <span>
          <span className="block text-sm font-semibold">{label}</span>
          <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{description}</span>
        </span>
      </div>
    </button>
  );
}

function LabourForm({ initialValues = initialState, onSubmit, isSubmitting = false, submitLabel = 'Save' }) {
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});
  const isEditMode = Boolean(initialValues?._id);

  useEffect(() => {
    setForm({
      name: initialValues.name || '',
      phone: initialValues.phone || '',
      section: initialValues.section || '',
      password: '',
      labourType: initialValues.labourType || LABOUR_TYPES.SALARY_BASED,
      salaryBasis: initialValues.salaryBasis || SALARY_BASIS.DAILY,
      dailyFixedAmount:
        initialValues.dailyFixedAmount !== undefined
          ? String(initialValues.dailyFixedAmount)
          : initialValues.labourType === LABOUR_TYPES.SALARY_BASED &&
              (initialValues.salaryBasis || SALARY_BASIS.DAILY) === SALARY_BASIS.DAILY &&
              initialValues.rate !== undefined
            ? String(initialValues.rate)
            : '',
      monthlySalary:
        initialValues.monthlySalary !== undefined
          ? String(initialValues.monthlySalary)
          : initialValues.labourType === LABOUR_TYPES.SALARY_BASED &&
              (initialValues.salaryBasis || SALARY_BASIS.DAILY) === SALARY_BASIS.MONTHLY &&
              initialValues.rate !== undefined
            ? String(initialValues.rate)
            : '',
      perPlyRate:
        initialValues.perPlyRate !== undefined
          ? String(initialValues.perPlyRate)
          : initialValues.labourType === LABOUR_TYPES.CONTRACT_BASED && initialValues.rate !== undefined
            ? String(initialValues.rate)
            : ''
    });
    setErrors({});
  }, [initialValues]);

  const validate = () => {
    const nextErrors = {};

    if (!form.name.trim()) nextErrors.name = 'Name is required';
    if (!form.phone.trim()) nextErrors.phone = 'Phone is required';
    if (!isEditMode && !form.password.trim()) nextErrors.password = 'Password is required';
    if (form.password && form.password.trim().length < 6) nextErrors.password = 'Password must be at least 6 characters';

    if (form.labourType === LABOUR_TYPES.SALARY_BASED) {
      if (form.salaryBasis === SALARY_BASIS.DAILY) {
        const parsedDaily = Number(form.dailyFixedAmount);
        if (!form.dailyFixedAmount) nextErrors.dailyFixedAmount = 'Daily salary is required';
        else if (Number.isNaN(parsedDaily) || parsedDaily <= 0) {
          nextErrors.dailyFixedAmount = 'Daily salary must be greater than 0';
        }
      }

      if (form.salaryBasis === SALARY_BASIS.MONTHLY) {
        const parsedMonthly = Number(form.monthlySalary);
        if (!form.monthlySalary) nextErrors.monthlySalary = 'Monthly salary is required';
        else if (Number.isNaN(parsedMonthly) || parsedMonthly <= 0) {
          nextErrors.monthlySalary = 'Monthly salary must be greater than 0';
        }
      }
    }

    if (form.labourType === LABOUR_TYPES.CONTRACT_BASED) {
      const parsedPerPly = Number(form.perPlyRate);
      if (!form.perPlyRate) nextErrors.perPlyRate = 'Per ply rate is required';
      else if (Number.isNaN(parsedPerPly) || parsedPerPly <= 0) {
        nextErrors.perPlyRate = 'Per ply rate must be greater than 0';
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) return;

    await onSubmit({
      name: form.name.trim(),
      phone: form.phone.trim(),
      section: form.section.trim(),
      password: form.password.trim(),
      labourType: form.labourType,
      salaryBasis: form.labourType === LABOUR_TYPES.SALARY_BASED ? form.salaryBasis : SALARY_BASIS.DAILY,
      dailyFixedAmount:
        form.labourType === LABOUR_TYPES.SALARY_BASED && form.salaryBasis === SALARY_BASIS.DAILY
          ? Number(form.dailyFixedAmount || 0)
          : 0,
      monthlySalary:
        form.labourType === LABOUR_TYPES.SALARY_BASED && form.salaryBasis === SALARY_BASIS.MONTHLY
          ? Number(form.monthlySalary || 0)
          : 0,
      perPlyRate:
        form.labourType === LABOUR_TYPES.CONTRACT_BASED ? Number(form.perPlyRate || 0) : 0
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <section className="rounded-2xl border border-slate-200/80 bg-white/80 p-3.5 dark:border-slate-700 dark:bg-slate-900/70">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Basic Details</h4>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Name and contact info for attendance records.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Input
            label="Labour Name"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            error={errors.name}
            placeholder="Enter name"
          />
          <Input
            label="Phone"
            value={form.phone}
            onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
            error={errors.phone}
            placeholder="Enter phone"
          />
          <Input
            label="Section"
            value={form.section}
            onChange={(event) => setForm((prev) => ({ ...prev, section: event.target.value }))}
            placeholder="Enter section (e.g. A, Machine-1)"
          />
          <Input
            label={isEditMode ? 'Login Password (Optional)' : 'Login Password'}
            type="password"
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            error={errors.password}
            placeholder={isEditMode ? 'Leave blank to keep current password' : 'Set login password'}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white/80 p-3.5 dark:border-slate-700 dark:bg-slate-900/70">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Category</h4>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Choose how this labour is billed.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {LABOUR_TYPE_OPTIONS.map((option) => {
            const meta = labourTypeMeta[option.value];
            return (
              <SelectTile
                key={option.value}
                active={form.labourType === option.value}
                icon={meta.icon}
                label={option.label}
                description={meta.description}
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    labourType: option.value,
                    salaryBasis: option.value === LABOUR_TYPES.SALARY_BASED ? prev.salaryBasis : SALARY_BASIS.DAILY
                  }))
                }
              />
            );
          })}
        </div>

        {form.labourType === LABOUR_TYPES.SALARY_BASED ? (
          <>
            <h5 className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Salary Type</h5>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {SALARY_BASIS_OPTIONS.map((option) => {
                const meta = salaryBasisMeta[option.value];
                return (
                  <SelectTile
                    key={option.value}
                    active={form.salaryBasis === option.value}
                    icon={meta.icon}
                    label={option.label}
                    description={meta.description}
                    onClick={() => setForm((prev) => ({ ...prev, salaryBasis: option.value }))}
                  />
                );
              })}
            </div>
          </>
        ) : null}
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white/80 p-3.5 dark:border-slate-700 dark:bg-slate-900/70">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Payment Setup</h4>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Enter the amount used for daily billing calculations.</p>

        <div className="mt-3">
          {form.labourType === LABOUR_TYPES.SALARY_BASED && form.salaryBasis === SALARY_BASIS.DAILY ? (
            <>
              <Input
                label="Daily Salary Amount"
                type="number"
                min="0"
                step="0.01"
                value={form.dailyFixedAmount}
                onChange={(event) => setForm((prev) => ({ ...prev, dailyFixedAmount: event.target.value }))}
                error={errors.dailyFixedAmount}
                placeholder="Enter daily salary"
              />
              <p className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800/80 dark:text-slate-300">
                Attendance logic: `10 hours = 1 attendance unit`.
              </p>
            </>
          ) : null}

          {form.labourType === LABOUR_TYPES.SALARY_BASED && form.salaryBasis === SALARY_BASIS.MONTHLY ? (
            <>
              <Input
                label="Monthly Salary Amount"
                type="number"
                min="0"
                step="0.01"
                value={form.monthlySalary}
                onChange={(event) => setForm((prev) => ({ ...prev, monthlySalary: event.target.value }))}
                error={errors.monthlySalary}
                placeholder="Enter monthly salary"
              />
              <p className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800/80 dark:text-slate-300">
                Daily payout is auto-calculated from month days (`28/29/30/31`).
              </p>
            </>
          ) : null}

          {form.labourType === LABOUR_TYPES.CONTRACT_BASED ? (
            <>
              <Input
                label="Per Ply Rate"
                type="number"
                min="0"
                step="0.01"
                value={form.perPlyRate}
                onChange={(event) => setForm((prev) => ({ ...prev, perPlyRate: event.target.value }))}
                error={errors.perPlyRate}
                placeholder="Enter per ply rate"
              />
              <p className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800/80 dark:text-slate-300">
                Daily amount = `Ply Finished x Per Ply Rate`.
              </p>
            </>
          ) : null}
        </div>
      </section>

      <div className="rounded-xl border border-primary-200 bg-primary-50/80 px-3 py-2 text-xs text-primary-800 dark:border-primary-800 dark:bg-primary-900/20 dark:text-primary-200">
        Current setup: {form.labourType === LABOUR_TYPES.SALARY_BASED ? 'Salary Based' : 'Contract Based'}
        {form.labourType === LABOUR_TYPES.SALARY_BASED ? ` • ${form.salaryBasis === SALARY_BASIS.DAILY ? 'Daily Salary' : 'Monthly Salary'}` : ''}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : submitLabel}
      </Button>
    </form>
  );
}

export default LabourForm;
