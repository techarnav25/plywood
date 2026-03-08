import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  Clock3,
  Filter,
  Layers3,
  Search,
  UserX,
  Users,
  Wallet
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import Card from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import Skeleton from '../components/common/Skeleton.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import { attendanceService } from '../services/attendanceService.js';
import { currencyFormat, dateInputToday } from '../utils/formatters.js';
import { useAuth } from '../hooks/useAuth.js';
import {
  calculateDashboardDayAmount,
  calculateSalaryAttendanceUnit,
  getLabourRateLabel,
  getLabourRateValue,
  getSalaryBasisLabel,
  getLabourTypeLabel,
  normalizeLabourType
} from '../utils/labour.js';
import { ADMIN_ROLES, LABOUR_TYPES } from '../utils/constants.js';

const summaryCards = [
  {
    key: 'totalPresent',
    label: 'Total Present Today',
    icon: Users,
    hint: 'Workers marked present',
    iconClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
  },
  {
    key: 'totalAbsent',
    label: 'Total Absent',
    icon: UserX,
    hint: 'Workers marked absent',
    iconClass: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
  },
  {
    key: 'totalPlyToday',
    label: 'Total Ply Today',
    icon: Layers3,
    hint: 'Contract output today',
    iconClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
  },
  {
    key: 'estimatedExpenseToday',
    label: 'Estimated Expense Today',
    isCurrency: true,
    icon: Wallet,
    hint: 'Projected daily payout',
    iconClass: 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
  }
];

const getLabourInitial = (name = '') => String(name || '').trim().charAt(0).toUpperCase() || 'L';

function DashboardPage() {
  const { admin } = useAuth();

  const canSubmitAttendance = admin?.role === ADMIN_ROLES.SUPER_ADMIN || admin?.role === ADMIN_ROLES.ADMIN;

  const [date, setDate] = useState(dateInputToday());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [summary, setSummary] = useState({
    totalPresent: 0,
    totalAbsent: 0,
    totalPlyToday: 0,
    estimatedExpenseToday: 0
  });
  const [rows, setRows] = useState([]);
  const [formMap, setFormMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeSubmitId, setActiveSubmitId] = useState(null);

  useEffect(() => {
    document.title = 'Dashboard | Labour Attendance';
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setDate(dateInputToday());
    }, 60000);

    return () => window.clearInterval(timer);
  }, []);

  const loadDashboard = async () => {
    try {
      setIsLoading(true);
      const [rowsResponse, summaryResponse] = await Promise.all([
        attendanceService.getDailyRows({
          date,
          search,
          status: statusFilter === 'all' ? undefined : statusFilter
        }),
        attendanceService.getSummary({ date })
      ]);

      const nextRows = rowsResponse.data.rows;
      setRows(nextRows);
      setSummary(summaryResponse.data);

      const mapped = {};
      nextRows.forEach((row) => {
        mapped[row.labourId] = {
          status: row.status || 'present',
          hours: row.hours || 0,
          ply: row.ply || 0
        };
      });

      setFormMap(mapped);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to fetch dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [date, search, statusFilter]);

  const updateRowState = (labourId, changes) => {
    setFormMap((prev) => ({
      ...prev,
      [labourId]: {
        ...prev[labourId],
        ...changes
      }
    }));
  };

  const handleStatusChange = (labourId, status) => {
    if (!canSubmitAttendance) {
      return;
    }

    if (status === 'absent') {
      updateRowState(labourId, { status, hours: 0, ply: 0 });
      return;
    }

    updateRowState(labourId, { status });
  };

  const handleSubmit = async (row) => {
    if (!canSubmitAttendance) {
      toast.error('You have read-only access to attendance.');
      return;
    }

    const local = formMap[row.labourId] || {};
    const status = local.status;

    if (!status) {
      toast.error('Select present or absent before submitting');
      return;
    }

    const labourType = normalizeLabourType(row.labourType);
    const hours = Number(local.hours || 0);
    const ply = Number(local.ply || 0);

    if (labourType === LABOUR_TYPES.SALARY_BASED && status === 'present') {
      if (Number.isNaN(hours) || hours <= 0 || hours > 10) {
        toast.error('Salary-based hours must be between 0 and 10');
        return;
      }
    }

    if (labourType === LABOUR_TYPES.CONTRACT_BASED) {
      if (Number.isNaN(ply) || ply < 0) {
        toast.error('Ply must be a non-negative number');
        return;
      }
    }

    try {
      setActiveSubmitId(row.labourId);
      await attendanceService.submit({
        labourId: row.labourId,
        date,
        status,
        hours: labourType === LABOUR_TYPES.SALARY_BASED ? hours : 0,
        ply: labourType === LABOUR_TYPES.CONTRACT_BASED ? ply : 0
      });

      toast.success(`${row.labourName} attendance saved`);
      await loadDashboard();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to submit attendance');
    } finally {
      setActiveSubmitId(null);
    }
  };

  const tableRows = useMemo(() => rows, [rows]);

  const getRowDerived = (row) => {
    const labourType = normalizeLabourType(row.labourType);
    const local = formMap[row.labourId] || { status: 'present', hours: 0, ply: 0 };
    const isLocked = row.isSubmitted;
    const attendanceUnit =
      labourType === LABOUR_TYPES.SALARY_BASED && local.status === 'present'
        ? calculateSalaryAttendanceUnit(local.hours)
        : 0;
    const dayAmount = calculateDashboardDayAmount({
      labourType,
      salaryBasis: row.salaryBasis,
      status: local.status,
      hours: local.hours,
      ply: local.ply,
      dailyFixedAmount: row.dailyFixedAmount,
      monthlySalary: row.monthlySalary,
      rate: row.rate,
      perPlyRate: row.perPlyRate,
      date
    });

    return {
      labourType,
      local,
      isLocked,
      attendanceUnit,
      dayAmount
    };
  };

  return (
    <section className="space-y-5">
      <div className="relative hidden overflow-hidden rounded-2xl border border-slate-200/70 bg-white/85 p-4 shadow-soft backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/70 sm:block sm:p-5">
        <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-primary-200/60 blur-2xl dark:bg-primary-900/40" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-sky-200/50 blur-2xl dark:bg-sky-900/35" />
        <div className="relative flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="inline-flex rounded-full bg-primary-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary-700 dark:bg-primary-900/40 dark:text-primary-200">
              Daily Operations
            </p>
            <h1 className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100 sm:text-2xl">Attendance Dashboard</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Track present/absent status, duty hours, production output, and daily payout estimates.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              <CalendarDays className="h-4 w-4 text-primary-600 dark:text-primary-300" />
              {date}
            </div>
            <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              <Users className="h-4 w-4 text-primary-600 dark:text-primary-300" />
              {admin?.role?.replace('_', ' ')}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <Card key={card.key} className="relative overflow-hidden p-4">
              <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-primary-100/50 blur-2xl dark:bg-primary-900/30" />
              {isLoading ? (
                <Skeleton className="h-16" />
              ) : (
                <div className="relative flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {card.isCurrency ? currencyFormat(summary[card.key]) : summary[card.key]}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{card.hint}</p>
                  </div>
                  <div className={`rounded-xl p-2 ${card.iconClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <Card className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Search Labour</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Type name, phone or section"
                className="w-full rounded-xl border border-slate-200/80 bg-white/90 py-2.5 pl-9 pr-3 text-sm text-slate-900 shadow-sm outline-none transition duration-200 placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-primary-900"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Date</span>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-2.5 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <CalendarDays className="h-4 w-4 text-primary-600 dark:text-primary-300" />
              {date}
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Filter</span>
            <div className="relative">
              <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200/80 bg-white/90 py-2.5 pl-9 pr-3 text-sm text-slate-900 shadow-sm outline-none transition duration-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:focus:ring-primary-900"
              >
                <option value="all">All</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
              </select>
            </div>
          </label>
        </div>

        {!canSubmitAttendance ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-200">
            Manager role has read-only access. Attendance rows are locked for edits.
          </div>
        ) : null}

        <div className="space-y-4 md:hidden">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, idx) => <Skeleton key={idx} className="h-[22rem] rounded-3xl" />)
          ) : tableRows.length === 0 ? (
            <EmptyState message="No labour found for selected filters." />
          ) : (
            tableRows.map((row) => {
              const { labourType, local, isLocked, attendanceUnit, dayAmount } = getRowDerived(row);

              return (
                <article
                  key={row.labourId}
                  className={`group relative overflow-hidden rounded-3xl border-2 p-4 shadow-sm transition ${
                    isLocked
                      ? 'border-slate-300 bg-slate-50/95 dark:border-slate-600 dark:bg-slate-900/60'
                      : 'border-primary-300 bg-gradient-to-br from-white via-blue-50/50 to-sky-50/40 dark:border-primary-700 dark:from-slate-900/90 dark:via-slate-900/80 dark:to-slate-800/70'
                  }`}
                >
                  <div className="pointer-events-none absolute -left-10 -top-10 h-28 w-28 rounded-full bg-primary-100/70 blur-2xl dark:bg-primary-900/20" />
                  <div className="pointer-events-none absolute -bottom-10 -right-10 h-28 w-28 rounded-full bg-cyan-100/70 blur-2xl dark:bg-cyan-900/20" />

                  <div className="relative">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-slate-900 dark:text-slate-100">{row.labourName}</p>
                        {row.section ? (
                          <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-300">
                            Section: {row.section}
                          </p>
                        ) : null}
                        <Link
                          to={`/labour/${row.labourId}`}
                          className="mt-1 inline-flex items-center rounded-full bg-primary-700 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow-sm hover:bg-primary-800 dark:bg-primary-600 dark:hover:bg-primary-500"
                        >
                          View billing
                        </Link>
                      </div>
                      <span className="rounded-full border border-primary-200 bg-primary-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary-700 dark:border-primary-800 dark:bg-primary-900/35 dark:text-primary-200">
                        {getLabourTypeLabel(labourType)}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-2 min-[430px]:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-white/95 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900/80">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{getLabourRateLabel(row)}</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">₹{getLabourRateValue(row)}</p>
                      </div>
                      <div className="rounded-2xl border border-primary-200 bg-primary-50/70 px-3 py-2.5 dark:border-primary-800 dark:bg-primary-900/25">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Today Amount</p>
                        <p className="mt-1 text-sm font-bold text-primary-700 dark:text-primary-200">{currencyFormat(dayAmount)}</p>
                      </div>
                    </div>

                    {labourType === LABOUR_TYPES.SALARY_BASED ? (
                      <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                        Salary Type: {getSalaryBasisLabel(row.salaryBasis)}
                        {row.salaryBasis === 'monthly' ? ` | Daily Calc: ${currencyFormat(row.salaryDailyRate)}` : ''}
                      </p>
                    ) : null}

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <label
                        className={`flex cursor-pointer items-center justify-center gap-3 rounded-2xl border px-2.5 py-2.5 text-xs font-semibold transition ${
                          local.status === 'present'
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                            : 'border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
                        } ${isLocked || !canSubmitAttendance ? 'cursor-not-allowed opacity-70' : ''}`}
                      >
                        <input
                          type="radio"
                          name={`status-${row.labourId}`}
                          checked={local.status === 'present'}
                          onChange={() => handleStatusChange(row.labourId, 'present')}
                          disabled={isLocked || !canSubmitAttendance}
                          className="h-4 w-4 accent-emerald-600"
                        />
                        Present
                      </label>
                      <label
                        className={`flex cursor-pointer items-center justify-center gap-3 rounded-2xl border px-2.5 py-2.5 text-xs font-semibold transition ${
                          local.status === 'absent'
                            ? 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
                            : 'border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
                        } ${isLocked || !canSubmitAttendance ? 'cursor-not-allowed opacity-70' : ''}`}
                      >
                        <input
                          type="radio"
                          name={`status-${row.labourId}`}
                          checked={local.status === 'absent'}
                          onChange={() => handleStatusChange(row.labourId, 'absent')}
                          disabled={isLocked || !canSubmitAttendance}
                          className="h-4 w-4 accent-rose-600"
                        />
                        Absent
                      </label>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-2 min-[430px]:grid-cols-2">
                      {labourType === LABOUR_TYPES.SALARY_BASED ? (
                        <>
                          <label className="block rounded-2xl border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900">
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                              <Clock3 className="h-3.5 w-3.5" />
                              Hours Worked
                            </span>
                            <input
                              type="number"
                              min="0"
                              max="10"
                              step="0.5"
                              className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900"
                              value={local.status === 'absent' ? 0 : local.hours}
                              disabled={isLocked || local.status === 'absent' || !canSubmitAttendance}
                              onChange={(event) =>
                                updateRowState(row.labourId, {
                                  hours: event.target.value
                                })
                              }
                            />
                          </label>
                          <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Attendance Unit</p>
                            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{attendanceUnit}</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <label className="block rounded-2xl border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900">
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                              <Layers3 className="h-3.5 w-3.5" />
                              Ply Finished
                            </span>
                            <input
                              type="number"
                              min="0"
                              className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900"
                              value={local.status === 'absent' ? 0 : local.ply}
                              disabled={isLocked || local.status === 'absent' || !canSubmitAttendance}
                              onChange={(event) =>
                                updateRowState(row.labourId, {
                                  ply: event.target.value
                                })
                              }
                            />
                          </label>
                          <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Attendance Unit</p>
                            <p className="mt-1 text-sm font-semibold text-slate-400">-</p>
                          </div>
                        </>
                      )}
                    </div>

                    <Button
                      className="mt-3 w-full px-3 py-2 text-xs"
                      disabled={isLocked || activeSubmitId === row.labourId || !canSubmitAttendance}
                      onClick={() => handleSubmit(row)}
                    >
                      {isLocked
                        ? 'Locked'
                        : !canSubmitAttendance
                          ? 'Read Only'
                          : activeSubmitId === row.labourId
                            ? 'Saving...'
                            : 'Submit'}
                    </Button>
                  </div>
                </article>
              );
            })
          )}
        </div>

        <div className="hidden md:block">
          <div className="table-shell rounded-2xl border border-slate-200/80 bg-white/95 dark:border-slate-700 dark:bg-slate-900/75">
            <table className="data-table min-w-[1050px]">
              <thead>
                <tr className="text-left">
                  <th className="px-2 py-3">Labour</th>
                  <th className="px-2 py-3">Category</th>
                  <th className="px-2 py-3 text-center">Present</th>
                  <th className="px-2 py-3 text-center">Absent</th>
                  <th className="px-2 py-3">Hours Worked</th>
                  <th className="px-2 py-3">Attendance Unit</th>
                  <th className="px-2 py-3">Ply Finished</th>
                  <th className="px-2 py-3">Today Amount</th>
                  <th className="px-2 py-3">Submit</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, idx) => (
                    <tr key={idx}>
                      <td colSpan={9} className="px-2 py-2">
                        <Skeleton className="h-10" />
                      </td>
                    </tr>
                  ))
                ) : tableRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-2 py-4">
                      <EmptyState message="No labour found for selected filters." />
                    </td>
                  </tr>
                ) : (
                  tableRows.map((row) => {
                    const { labourType, local, isLocked, attendanceUnit, dayAmount } = getRowDerived(row);

                    return (
                      <tr key={row.labourId} className={`${isLocked ? 'bg-slate-50 dark:bg-slate-900/55' : ''}`}>
                        <td className="px-2 py-2">
                          <div className="flex items-start gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-xs font-bold text-primary-700 dark:bg-primary-900/40 dark:text-primary-200">
                              {getLabourInitial(row.labourName)}
                            </div>
                            <div>
                              <div className="font-medium text-slate-900 dark:text-slate-100">{row.labourName}</div>
                              {row.section ? (
                                <div className="text-[11px] font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-300">
                                  Section: {row.section}
                                </div>
                              ) : null}
                              <Link to={`/labour/${row.labourId}`} className="text-xs text-primary-700 hover:underline dark:text-primary-300">
                                View billing
                              </Link>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-2">
                          <p className="inline-flex rounded-full bg-primary-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary-700 dark:bg-primary-900/40 dark:text-primary-200">
                            {getLabourTypeLabel(labourType)}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {getLabourRateLabel(row)}: ₹{getLabourRateValue(row)}
                          </p>
                          {labourType === LABOUR_TYPES.SALARY_BASED ? (
                            <p className="text-xs text-slate-500">
                              Salary Type: {getSalaryBasisLabel(row.salaryBasis)}
                              {row.salaryBasis === 'monthly' ? ` | Daily Calc: ${currencyFormat(row.salaryDailyRate)}` : ''}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-2 py-2 text-center">
                          <input
                            type="radio"
                            checked={local.status === 'present'}
                            onChange={() => handleStatusChange(row.labourId, 'present')}
                            disabled={isLocked || !canSubmitAttendance}
                          />
                        </td>
                        <td className="px-2 py-2 text-center">
                          <input
                            type="radio"
                            checked={local.status === 'absent'}
                            onChange={() => handleStatusChange(row.labourId, 'absent')}
                            disabled={isLocked || !canSubmitAttendance}
                          />
                        </td>
                        <td className="px-2 py-2">
                          {labourType === LABOUR_TYPES.SALARY_BASED ? (
                            <input
                              type="number"
                              min="0"
                              max="10"
                              step="0.5"
                              className="w-24 rounded-lg border border-slate-200 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900"
                              value={local.status === 'absent' ? 0 : local.hours}
                              disabled={isLocked || local.status === 'absent' || !canSubmitAttendance}
                              onChange={(event) =>
                                updateRowState(row.labourId, {
                                  hours: event.target.value
                                })
                              }
                            />
                          ) : (
                            <span className="text-sm text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-2 py-2 text-sm font-semibold">
                          {labourType === LABOUR_TYPES.SALARY_BASED ? attendanceUnit : '-'}
                        </td>
                        <td className="px-2 py-2">
                          {labourType === LABOUR_TYPES.CONTRACT_BASED ? (
                            <input
                              type="number"
                              min="0"
                              className="w-24 rounded-lg border border-slate-200 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900"
                              value={local.status === 'absent' ? 0 : local.ply}
                              disabled={isLocked || local.status === 'absent' || !canSubmitAttendance}
                              onChange={(event) =>
                                updateRowState(row.labourId, {
                                  ply: event.target.value
                                })
                              }
                            />
                          ) : (
                            <span className="text-sm text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-2 py-2">
                          <span className="inline-flex rounded-lg bg-primary-50 px-2.5 py-1 text-sm font-semibold text-primary-700 dark:bg-primary-900/35 dark:text-primary-200">
                            {currencyFormat(dayAmount)}
                          </span>
                        </td>
                        <td className="px-2 py-2">
                          <Button
                            className="px-3 py-2 text-xs"
                            disabled={isLocked || activeSubmitId === row.labourId || !canSubmitAttendance}
                            onClick={() => handleSubmit(row)}
                          >
                            {isLocked
                              ? 'Locked'
                              : !canSubmitAttendance
                                ? 'Read Only'
                                : activeSubmitId === row.labourId
                                  ? 'Saving...'
                                  : 'Submit'}
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </section>
  );
}

export default DashboardPage;
