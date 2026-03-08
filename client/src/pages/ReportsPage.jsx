import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import Card from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import Skeleton from '../components/common/Skeleton.jsx';
import { reportService } from '../services/reportService.js';
import { MONTH_OPTIONS } from '../utils/constants.js';
import { currencyFormat } from '../utils/formatters.js';
import { getLabourTypeLabel, getSalaryBasisLabel } from '../utils/labour.js';

function ReportsPage() {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const years = [today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1];

  useEffect(() => {
    document.title = 'Reports | Labour Attendance';
  }, []);

  const loadReports = async () => {
    try {
      setIsLoading(true);
      const response = await reportService.getMonthly(month, year);
      setRows(response.data.rows || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to fetch reports');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [month, year]);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        acc.totalGross += row.grossAmount;
        acc.totalFinal += row.finalPayable;
        acc.totalDues += row.duesOnLabour || 0;
        acc.totalExtra += row.extraAmount || 0;
        acc.totalCanteen += row.canteenTotal || 0;
        acc.totalAdvance += row.advanceTotal || 0;
        acc.totalPly += row.totalPly;
        return acc;
      },
      {
        totalGross: 0,
        totalFinal: 0,
        totalDues: 0,
        totalExtra: 0,
        totalCanteen: 0,
        totalAdvance: 0,
        totalPly: 0
      }
    );
  }, [rows]);

  return (
    <section className="space-y-5">
      <div>
        <h1 className="page-heading">Monthly Reports</h1>
        <p className="page-subtitle">View category-wise billing, adjustments, dues, and payable totals for each month.</p>
      </div>

      <Card>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Month</span>
              <select
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900"
                value={month}
                onChange={(event) => setMonth(Number(event.target.value))}
              >
                {MONTH_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Year</span>
              <select
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900"
                value={year}
                onChange={(event) => setYear(Number(event.target.value))}
              >
                {years.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <Button variant="secondary" onClick={loadReports}>
            Refresh
          </Button>
        </div>
      </Card>

      <Card>
        <div className="mb-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-7">
          <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
            <p className="text-xs uppercase tracking-wide text-slate-500">Total Gross</p>
            <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{currencyFormat(totals.totalGross)}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
            <p className="text-xs uppercase tracking-wide text-slate-500">Total Extra</p>
            <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{currencyFormat(totals.totalExtra)}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
            <p className="text-xs uppercase tracking-wide text-slate-500">Total Canteen</p>
            <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{currencyFormat(totals.totalCanteen)}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
            <p className="text-xs uppercase tracking-wide text-slate-500">Total Advance</p>
            <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{currencyFormat(totals.totalAdvance)}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
            <p className="text-xs uppercase tracking-wide text-slate-500">Total Final Payable</p>
            <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{currencyFormat(totals.totalFinal)}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
            <p className="text-xs uppercase tracking-wide text-slate-500">Total Dues</p>
            <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{currencyFormat(totals.totalDues)}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
            <p className="text-xs uppercase tracking-wide text-slate-500">Total Ply</p>
            <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{totals.totalPly}</p>
          </div>
        </div>

        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr className="text-left">
                <th className="px-2 py-3">Labour</th>
                <th className="px-2 py-3">Section</th>
                <th className="px-2 py-3">Category</th>
                <th className="px-2 py-3">Salary Type</th>
                <th className="px-2 py-3">Rate</th>
                <th className="px-2 py-3">Attendance Days</th>
                <th className="px-2 py-3">Present Days</th>
                <th className="px-2 py-3">Hours</th>
                <th className="px-2 py-3">Attendance Unit</th>
                <th className="px-2 py-3">Ply</th>
                <th className="px-2 py-3">Gross</th>
                <th className="px-2 py-3">Extra</th>
                <th className="px-2 py-3">Canteen</th>
                <th className="px-2 py-3">Advance</th>
                <th className="px-2 py-3">Final</th>
                <th className="px-2 py-3">Dues</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={idx}>
                    <td colSpan={16} className="px-2 py-2">
                      <Skeleton className="h-10" />
                    </td>
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={16} className="px-2 py-4">
                    <EmptyState message="No records available for selected month." />
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.labourId} className="text-sm">
                    <td className="px-2 py-2 font-medium">{row.labourName}</td>
                    <td className="px-2 py-2">{row.section || '-'}</td>
                    <td className="px-2 py-2">{getLabourTypeLabel(row.labourType)}</td>
                    <td className="px-2 py-2">
                      {row.labourType === 'salary_based' ? getSalaryBasisLabel(row.salaryBasis) : '-'}
                    </td>
                    <td className="px-2 py-2">
                      {row.labourType === 'contract_based'
                        ? `Per Ply: ${currencyFormat(row.perPlyRate)}`
                        : row.salaryBasis === 'monthly'
                          ? `Monthly: ${currencyFormat(row.monthlySalary)} | Daily(${row.monthDays}): ${currencyFormat(row.effectiveDailyRate)}`
                          : `Daily: ${currencyFormat(row.dailyFixedAmount)}`}
                    </td>
                    <td className="px-2 py-2">{row.totalDays}</td>
                    <td className="px-2 py-2">{row.totalPresentDays}</td>
                    <td className="px-2 py-2">{row.totalHours}</td>
                    <td className="px-2 py-2">{row.totalAttendanceUnits}</td>
                    <td className="px-2 py-2">{row.totalPly}</td>
                    <td className="px-2 py-2">{currencyFormat(row.grossAmount)}</td>
                    <td className="px-2 py-2">{currencyFormat(row.extraAmount)}</td>
                    <td className="px-2 py-2">{currencyFormat(row.canteenTotal)}</td>
                    <td className="px-2 py-2">{currencyFormat(row.advanceTotal)}</td>
                    <td className="px-2 py-2 font-semibold text-primary-700 dark:text-primary-300">
                      {currencyFormat(row.finalPayable)}
                    </td>
                    <td className="px-2 py-2 font-semibold text-amber-700 dark:text-amber-300">
                      {currencyFormat(row.duesOnLabour)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
}

export default ReportsPage;
