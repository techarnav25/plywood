import { BriefcaseBusiness, CalendarDays, Layers3, Wallet } from 'lucide-react';
import Card from '../common/Card.jsx';
import { currencyFormat } from '../../utils/formatters.js';
import { LABOUR_TYPES } from '../../utils/constants.js';
import {
  getLabourTypeLabel,
  getSalaryBasisLabel,
  normalizeLabourType,
  normalizeSalaryBasis
} from '../../utils/labour.js';

function MetricItem({ label, value, tone = 'default' }) {
  const toneMap = {
    default: 'border-slate-200/80 bg-white/80 dark:border-slate-700 dark:bg-slate-900/70',
    info: 'border-sky-200/80 bg-sky-50/80 dark:border-sky-900/60 dark:bg-sky-900/20',
    success: 'border-emerald-200/80 bg-emerald-50/80 dark:border-emerald-900/60 dark:bg-emerald-900/20',
    danger: 'border-rose-200/80 bg-rose-50/80 dark:border-rose-900/60 dark:bg-rose-900/20'
  };

  return (
    <div className={`rounded-2xl border p-3 ${toneMap[tone] || toneMap.default}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  );
}

function BillingSummaryCard({ summary }) {
  const labourType = normalizeLabourType(summary.labour.labourType);
  const salaryBasis = normalizeSalaryBasis(summary.labour.salaryBasis);
  const rateLabel =
    labourType === LABOUR_TYPES.CONTRACT_BASED
      ? 'Per Ply Rate'
      : salaryBasis === 'monthly'
        ? 'Monthly Salary'
        : 'Daily Salary';
  const rateValue =
    labourType === LABOUR_TYPES.CONTRACT_BASED
      ? summary.labour.perPlyRate
      : salaryBasis === 'monthly'
        ? summary.labour.monthlySalary
        : summary.labour.dailyFixedAmount;

  return (
    <Card className="relative overflow-hidden">
      <div className="pointer-events-none absolute -right-14 -top-14 h-36 w-36 rounded-full bg-primary-100/65 blur-3xl dark:bg-primary-900/25" />

      <div className="relative">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Monthly Summary</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Attendance, adjustments, and payout breakdown for the selected month.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-primary-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary-700 dark:border-primary-800 dark:bg-primary-900/30 dark:text-primary-200">
              {labourType === LABOUR_TYPES.CONTRACT_BASED ? <Layers3 className="h-3.5 w-3.5" /> : <BriefcaseBusiness className="h-3.5 w-3.5" />}
              {getLabourTypeLabel(labourType)}
            </span>
            {labourType === LABOUR_TYPES.SALARY_BASED ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-sky-700 dark:border-sky-800 dark:bg-sky-900/30 dark:text-sky-200">
                <CalendarDays className="h-3.5 w-3.5" />
                {getSalaryBasisLabel(salaryBasis)}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              <Wallet className="h-3.5 w-3.5" />
              {rateLabel}: {currencyFormat(rateValue)}
            </span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricItem label="Total Attendance Days" value={summary.totalDays} />
          <MetricItem label="Total Present Days" value={summary.totalPresentDays} />
          <MetricItem label="Total Hours" value={summary.totalHours} />
          <MetricItem label="Attendance Unit" value={summary.totalAttendanceUnits} />
          <MetricItem label="Total Ply" value={summary.totalPly} />
          {labourType === LABOUR_TYPES.SALARY_BASED && salaryBasis === 'monthly' ? (
            <MetricItem label={`Daily Rate (${summary.monthDays} days)`} value={currencyFormat(summary.effectiveDailyRate)} />
          ) : null}
          <MetricItem label="Gross Amount" value={currencyFormat(summary.grossAmount)} tone="info" />
          <MetricItem label="Extra Amount" value={currencyFormat(summary.extraAmount)} tone="success" />
          <MetricItem label="Canteen Total" value={currencyFormat(summary.canteenTotal)} />
          <MetricItem label="Advance Total" value={currencyFormat(summary.advanceTotal)} />
          <MetricItem label="Dues On Labour" value={currencyFormat(summary.duesOnLabour)} tone="danger" />
          <MetricItem label="Final Payable" value={currencyFormat(summary.finalPayable)} tone="success" />
        </div>
      </div>
    </Card>
  );
}

export default BillingSummaryCard;
