import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  BadgeDollarSign,
  BriefcaseBusiness,
  CalendarDays,
  Clock3,
  Download,
  Eye,
  HandCoins,
  Layers3,
  Phone,
  Printer,
  UtensilsCrossed,
  Wallet
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';
import Card from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import Input from '../components/common/Input.jsx';
import Modal from '../components/common/Modal.jsx';
import Skeleton from '../components/common/Skeleton.jsx';
import BillingSummaryCard from '../components/labour/BillingSummaryCard.jsx';
import { billingService } from '../services/billingService.js';
import { ADMIN_ROLES, MONTH_OPTIONS } from '../utils/constants.js';
import { currencyFormat } from '../utils/formatters.js';
import { useAuth } from '../hooks/useAuth.js';
import {
  getLabourTypeLabel,
  getSalaryBasisLabel,
  normalizeLabourType,
  normalizeSalaryBasis
} from '../utils/labour.js';

const formatDate = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const toInputDate = (date) => {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10);
};

const getDefaultDateByMonth = (month, year) => {
  const today = new Date();

  if (today.getMonth() + 1 === month && today.getFullYear() === year) {
    return toInputDate(today);
  }

  return `${year}-${String(month).padStart(2, '0')}-01`;
};

const getNameInitial = (name = '') => {
  const trimmed = String(name || '').trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : 'L';
};

function HeaderStat({ label, value, icon: Icon, tone = 'default' }) {
  const toneClasses = {
    default: 'border-slate-200/80 bg-white/80 dark:border-slate-700 dark:bg-slate-900/70',
    info: 'border-sky-200/80 bg-sky-50/80 dark:border-sky-900/60 dark:bg-sky-900/20',
    success: 'border-emerald-200/80 bg-emerald-50/80 dark:border-emerald-900/60 dark:bg-emerald-900/20'
  };

  return (
    <div className={`rounded-2xl border px-3 py-2.5 ${toneClasses[tone] || toneClasses.default}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        {Icon ? <Icon className="h-4 w-4 text-primary-700 dark:text-primary-300" /> : null}
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{value}</p>
      </div>
    </div>
  );
}

function AdjustmentPanel({ index, title, subtitle, icon: Icon, tone = 'blue', stats = [], children }) {
  const toneClasses = {
    blue: {
      panel:
        'border-2 border-sky-200/90 bg-gradient-to-b from-sky-50/95 via-white to-sky-100/65 shadow-[0_18px_40px_rgba(2,132,199,0.14)] dark:border-sky-900/60 dark:from-sky-900/20 dark:via-slate-900 dark:to-sky-950/20 dark:shadow-[0_18px_40px_rgba(2,8,23,0.35)]',
      chip: 'border-sky-200 bg-white/95 text-sky-700 dark:border-sky-800 dark:bg-sky-900/35 dark:text-sky-200',
      badge: 'border-sky-300 bg-sky-100 text-sky-700 dark:border-sky-800 dark:bg-sky-900/45 dark:text-sky-200',
      icon: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200',
      glow: 'bg-sky-200/60 dark:bg-sky-900/30'
    },
    emerald: {
      panel:
        'border-2 border-emerald-200/90 bg-gradient-to-b from-emerald-50/95 via-white to-emerald-100/65 shadow-[0_18px_40px_rgba(16,185,129,0.14)] dark:border-emerald-900/60 dark:from-emerald-900/20 dark:via-slate-900 dark:to-emerald-950/20 dark:shadow-[0_18px_40px_rgba(2,8,23,0.35)]',
      chip: 'border-emerald-200 bg-white/95 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/35 dark:text-emerald-200',
      badge: 'border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/45 dark:text-emerald-200',
      icon: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200',
      glow: 'bg-emerald-200/60 dark:bg-emerald-900/30'
    },
    amber: {
      panel:
        'border-2 border-amber-200/90 bg-gradient-to-b from-amber-50/95 via-white to-orange-100/65 shadow-[0_18px_40px_rgba(245,158,11,0.16)] dark:border-amber-900/60 dark:from-amber-900/20 dark:via-slate-900 dark:to-orange-950/20 dark:shadow-[0_18px_40px_rgba(2,8,23,0.35)]',
      chip: 'border-amber-200 bg-white/95 text-amber-700 dark:border-amber-800 dark:bg-amber-900/35 dark:text-amber-200',
      badge: 'border-amber-300 bg-amber-100 text-amber-700 dark:border-amber-800 dark:bg-amber-900/45 dark:text-amber-200',
      icon: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200',
      glow: 'bg-amber-200/60 dark:bg-amber-900/30'
    }
  };
  const palette = toneClasses[tone] || toneClasses.blue;

  return (
    <div className={`relative overflow-hidden rounded-3xl p-4 ${palette.panel}`}>
      <div className={`pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full blur-2xl ${palette.glow}`} />

      <div className="relative mb-3 flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          {Icon ? (
            <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${palette.icon}`}>
              <Icon className="h-5 w-5" />
            </span>
          ) : null}
          <div>
            <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h4>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Adjustment {index}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
          </div>
        </div>
        <span className={`inline-flex h-8 min-w-8 items-center justify-center rounded-full border px-2 text-[11px] font-bold ${palette.badge}`}>
          {index}
        </span>
      </div>

      <div className="relative">
        {stats.length ? (
          <div className="mb-3 flex flex-wrap gap-2">
            {stats.map((item) => (
              <span
                key={item.label}
                className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${palette.chip}`}
              >
                {item.label}: {item.value}
              </span>
            ))}
          </div>
        ) : null}

        <div className="space-y-2.5">{children}</div>
      </div>
    </div>
  );
}

function PanelActionButton({ label, isLoading, disabled, onClick, tone = 'blue' }) {
  const toneClasses = {
    blue:
      'bg-gradient-to-r from-primary-700 via-sky-600 to-cyan-500 text-white shadow-[0_10px_24px_rgba(2,132,199,0.32)] hover:from-primary-800 hover:via-sky-700 hover:to-cyan-600',
    emerald:
      'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-500 text-white shadow-[0_10px_24px_rgba(16,185,129,0.30)] hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-600',
    amber:
      'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white shadow-[0_10px_24px_rgba(249,115,22,0.32)] hover:from-amber-600 hover:via-orange-600 hover:to-rose-600'
  };

  return (
    <Button className={`w-full ${toneClasses[tone] || toneClasses.blue}`} onClick={onClick} disabled={disabled || isLoading}>
      {isLoading ? 'Saving...' : label}
    </Button>
  );
}

function EntrySection({ title, subtitle, columns, rows, emptyMessage }) {
  const hasRows = rows && rows.length > 0;

  return (
    <Card className="overflow-hidden">
      <div className="mb-3">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
      </div>

      {!hasRows ? (
        <p className="rounded-2xl border border-slate-200/80 bg-white/80 px-3 py-3 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/70">
          {emptyMessage}
        </p>
      ) : (
        <>
          <div className="space-y-2 md:hidden">
            {rows.map((row, rowIndex) => (
              <article
                key={row.id || `${title}-${rowIndex}`}
                className="rounded-2xl border border-slate-200/80 bg-white/85 p-3 dark:border-slate-700 dark:bg-slate-900/70"
              >
                <div className="grid gap-2 min-[450px]:grid-cols-2">
                  {columns.map((column) => (
                    <div key={column.key}>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{column.label}</p>
                      <p className="mt-0.5 text-sm text-slate-800 dark:text-slate-100">{column.render(row)}</p>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <div className="hidden md:block">
            <div className="table-shell rounded-2xl border border-slate-200/80 bg-white/90 dark:border-slate-700 dark:bg-slate-900/75">
              <table className="data-table min-w-[740px]">
                <thead>
                  <tr className="text-left">
                    {columns.map((column) => (
                      <th key={column.key} className="px-2 py-2">
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, rowIndex) => (
                    <tr key={row.id || `${title}-${rowIndex}`} className="text-sm">
                      {columns.map((column) => (
                        <td key={column.key} className="px-2 py-2">
                          {column.render(row)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}

function LabourProfilePage({ selfMode = false }) {
  const { id } = useParams();
  const { admin } = useAuth();

  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isAddingCanteen, setIsAddingCanteen] = useState(false);
  const [isAddingAdvance, setIsAddingAdvance] = useState(false);
  const [isAddingExtra, setIsAddingExtra] = useState(false);
  const [isPlyLogModalOpen, setIsPlyLogModalOpen] = useState(false);

  const [canteenForm, setCanteenForm] = useState({ amount: '', date: getDefaultDateByMonth(month, year) });
  const [advanceForm, setAdvanceForm] = useState({ amount: '', date: getDefaultDateByMonth(month, year) });
  const [extraForm, setExtraForm] = useState({ quantity: '', date: getDefaultDateByMonth(month, year), note: '' });

  const canManageAdjustments =
    admin?.role === ADMIN_ROLES.SUPER_ADMIN || admin?.role === ADMIN_ROLES.ADMIN;
  const isLabourViewer = admin?.role === ADMIN_ROLES.LABOUR;
  const years = [today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1];

  const loadBilling = async () => {
    try {
      setIsLoading(true);
      const response = selfMode
        ? await billingService.getMyProfileBilling(month, year)
        : await billingService.getLabourBilling(id, month, year);
      setSummary(response.data);
      document.title = `${response.data.labour.name} | Labour Profile`;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to fetch billing profile');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBilling();
  }, [id, month, year, selfMode]);

  useEffect(() => {
    const nextDate = getDefaultDateByMonth(month, year);
    setCanteenForm((prev) => ({ ...prev, date: nextDate }));
    setAdvanceForm((prev) => ({ ...prev, date: nextDate }));
    setExtraForm((prev) => ({ ...prev, date: nextDate }));
  }, [month, year]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    if (!summary) return;

    const labourType = normalizeLabourType(summary.labour.labourType);
    const salaryBasis = normalizeSalaryBasis(summary.labour.salaryBasis);
    const monthText = `${MONTH_OPTIONS.find((item) => item.value === summary.month)?.label || summary.month} ${summary.year}`;
    const attendanceValue = labourType === 'contract_based' ? summary.totalPresentDays : summary.totalAttendanceUnits;
    const rateText =
      labourType === 'contract_based'
        ? `Per Ply: ${currencyFormat(summary.labour.perPlyRate)}`
        : salaryBasis === 'monthly'
          ? `Monthly: ${currencyFormat(summary.labour.monthlySalary)} | Daily(${summary.monthDays}): ${currencyFormat(summary.effectiveDailyRate)}`
          : `Daily: ${currencyFormat(summary.labour.dailyFixedAmount)}`;

    const grossFormula =
      labourType === 'contract_based'
        ? `Gross = Total Ply (${summary.totalPly}) x Per Ply Rate (${currencyFormat(summary.labour.perPlyRate)})`
        : salaryBasis === 'monthly'
          ? `Gross = Hajiri (${summary.totalAttendanceUnits}) x Daily Rate (${currencyFormat(summary.effectiveDailyRate)})`
          : `Gross = Hajiri (${summary.totalAttendanceUnits}) x Daily Salary (${currencyFormat(summary.labour.dailyFixedAmount)})`;

    const finalFormula = `Final = Gross + Extra - Canteen - Advance`;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a5'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 8;
    const contentWidth = pageWidth - margin * 2;
    const midX = margin + contentWidth / 2;
    const cardGap = 3;
    const halfCardWidth = contentWidth / 2 - cardGap / 2;

    const drawCard = ({ x, y, w, h, title, value, bg, border, titleColor = [71, 85, 105], valueColor = [15, 23, 42], valueSize = 13 }) => {
      doc.setFillColor(...bg);
      doc.setDrawColor(...border);
      doc.roundedRect(x, y, w, h, 3, 3, 'FD');
      doc.setTextColor(...titleColor);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(title, x + 3, y + 5.5);
      doc.setTextColor(...valueColor);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(valueSize);
      doc.text(String(value), x + 3, y + 12.5);
    };

    doc.setFillColor(245, 248, 255);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    doc.setFillColor(15, 76, 129);
    doc.roundedRect(margin, margin, contentWidth, 24, 4, 4, 'F');
    doc.setFillColor(10, 132, 170);
    doc.roundedRect(margin, margin + 14, contentWidth, 10, 0, 0, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Labour Billing Sheet', margin + 4, margin + 8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`Month: ${monthText}`, margin + 4, margin + 14);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, margin + 4, margin + 19);

    doc.setFillColor(255, 255, 255);
    doc.roundedRect(pageWidth - margin - 42, margin + 3.5, 38, 17, 3, 3, 'F');
    doc.setTextColor(15, 76, 129);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`${currencyFormat(summary.finalPayable)}`, pageWidth - margin - 39, margin + 11.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('Final Payable', pageWidth - margin - 39, margin + 16);

    const metaY = 35;
    drawCard({
      x: margin,
      y: metaY,
      w: contentWidth,
      h: 18,
      title: `${summary.labour.name} | ${summary.labour.phone}${summary.labour.section ? ` | Section: ${summary.labour.section}` : ''}`,
      value: `${getLabourTypeLabel(labourType)} | ${labourType === 'salary_based' ? getSalaryBasisLabel(salaryBasis) : 'Output Based'}`,
      bg: [255, 255, 255],
      border: [203, 213, 225],
      valueSize: 10
    });

    const rateY = 56;
    drawCard({
      x: margin,
      y: rateY,
      w: contentWidth,
      h: 14,
      title: 'Rate Details',
      value: rateText,
      bg: [240, 249, 255],
      border: [125, 211, 252],
      titleColor: [3, 105, 161],
      valueColor: [12, 74, 110],
      valueSize: 9
    });

    const statsY = 73;
    drawCard({
      x: margin,
      y: statsY,
      w: halfCardWidth,
      h: 24,
      title: labourType === 'contract_based' ? 'Total Present Days' : 'Total Hajiri',
      value: attendanceValue,
      bg: [239, 246, 255],
      border: [147, 197, 253],
      titleColor: [30, 64, 175],
      valueColor: [30, 64, 175],
      valueSize: 19
    });
    drawCard({
      x: midX + cardGap / 2,
      y: statsY,
      w: halfCardWidth,
      h: 24,
      title: 'Total Days / Month Days',
      value: `${summary.totalPresentDays} / ${summary.monthDays}`,
      bg: [236, 253, 245],
      border: [110, 231, 183],
      titleColor: [5, 150, 105],
      valueColor: [5, 150, 105],
      valueSize: 17
    });

    const formulaY = 100;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(186, 230, 253);
    doc.roundedRect(margin, formulaY, contentWidth, 26, 3, 3, 'FD');
    doc.setTextColor(3, 105, 161);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('Calculation', margin + 3, formulaY + 5);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(doc.splitTextToSize(grossFormula, contentWidth - 6), margin + 3, formulaY + 10);
    doc.text(doc.splitTextToSize(finalFormula, contentWidth - 6), margin + 3, formulaY + 18);

    const breakdownY = 129;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, breakdownY, contentWidth, 62, 3, 3, 'FD');
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('Amount Breakdown', margin + 3, breakdownY + 5.5);

    const amountRows = [
      ['Gross Amount', currencyFormat(summary.grossAmount)],
      ['Extra Amount', currencyFormat(summary.extraAmount)],
      ['Canteen', currencyFormat(summary.canteenTotal)],
      ['Advance', currencyFormat(summary.advanceTotal)],
      ['Dues', currencyFormat(summary.duesOnLabour)],
      ['Final Payable', currencyFormat(summary.finalPayable)]
    ];

    let rowY = breakdownY + 10;
    amountRows.forEach(([label, value], index) => {
      doc.setDrawColor(226, 232, 240);
      if (index > 0) {
        doc.line(margin + 2, rowY - 1.3, margin + contentWidth - 2, rowY - 1.3);
      }
      const isFinal = label === 'Final Payable';
      doc.setTextColor(isFinal ? 5 : 51, isFinal ? 150 : 65, isFinal ? 105 : 85);
      doc.setFont('helvetica', isFinal ? 'bold' : 'normal');
      doc.setFontSize(8.5);
      doc.text(label, margin + 3, rowY + 2);
      doc.setFont('helvetica', 'bold');
      doc.text(value, margin + contentWidth - 3, rowY + 2, { align: 'right' });
      rowY += 8.5;
    });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('Generated from Labour Attendance & Billing System', margin, pageHeight - 5.5);

    doc.save(`${summary.labour.name.replace(/\s+/g, '_')}_${summary.month}_${summary.year}_A5.pdf`);
  };

  const reloadAndReset = (data) => {
    setSummary(data);
    setCanteenForm((prev) => ({ ...prev, amount: '' }));
    setAdvanceForm((prev) => ({ ...prev, amount: '' }));
    setExtraForm((prev) => ({ ...prev, quantity: '', note: '' }));
  };

  const handleAddCanteen = async () => {
    const amount = Number(canteenForm.amount);

    if (Number.isNaN(amount) || amount <= 0) {
      toast.error('Enter valid canteen amount');
      return;
    }

    try {
      setIsAddingCanteen(true);
      const response = await billingService.addCanteenEntry(id, {
        month,
        year,
        amount,
        date: canteenForm.date
      });
      reloadAndReset(response.data);
      toast.success('Canteen entry added');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to add canteen entry');
    } finally {
      setIsAddingCanteen(false);
    }
  };

  const handleAddAdvance = async () => {
    const amount = Number(advanceForm.amount);

    if (Number.isNaN(amount) || amount <= 0) {
      toast.error('Enter valid advance amount');
      return;
    }

    try {
      setIsAddingAdvance(true);
      const response = await billingService.addAdvanceEntry(id, {
        month,
        year,
        amount,
        date: advanceForm.date
      });
      reloadAndReset(response.data);
      toast.success('Advance entry added');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to add advance entry');
    } finally {
      setIsAddingAdvance(false);
    }
  };

  const handleAddExtra = async () => {
    const quantity = Number(extraForm.quantity);

    if (Number.isNaN(quantity) || quantity <= 0) {
      toast.error('Enter valid extra value');
      return;
    }

    try {
      setIsAddingExtra(true);
      const response = await billingService.addExtraEntry(id, {
        month,
        year,
        quantity,
        date: extraForm.date,
        note: extraForm.note
      });
      reloadAndReset(response.data);
      toast.success('Extra entry added');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to add extra entry');
    } finally {
      setIsAddingExtra(false);
    }
  };

  if (isLoading || !summary) {
    return (
      <section className="space-y-4">
        <Skeleton className="h-36 rounded-3xl" />
        <Skeleton className="h-56 rounded-3xl" />
        <Skeleton className="h-60 rounded-3xl" />
      </section>
    );
  }

  const labourType = normalizeLabourType(summary.labour.labourType);
  const salaryBasis = normalizeSalaryBasis(summary.labour.salaryBasis);
  const extraLabel = labourType === 'contract_based' ? 'Extra Ply' : 'Extra Hours (Night)';
  const monthLabel = MONTH_OPTIONS.find((item) => item.value === month)?.label || month;
  const rateLabel =
    labourType === 'contract_based'
      ? 'Per Ply Rate'
      : salaryBasis === 'monthly'
        ? 'Monthly Salary'
        : 'Daily Salary';
  const rateValue =
    labourType === 'contract_based'
      ? summary.labour.perPlyRate
      : salaryBasis === 'monthly'
        ? summary.labour.monthlySalary
        : summary.labour.dailyFixedAmount;
  const attendanceLabel =
    labourType === 'contract_based' ? 'कुल उपस्थिति / Total Present' : 'कुल हाजिरी / Total Hajiri';
  const attendanceValue =
    labourType === 'contract_based' ? summary.totalPresentDays : summary.totalAttendanceUnits;
  const grossCalculationLine =
    labourType === 'contract_based'
      ? `कुल कमाई (Gross) = कुल प्लाई ${summary.totalPly} × प्रति प्लाई ${currencyFormat(summary.labour.perPlyRate)} = ${currencyFormat(summary.grossAmount)}`
      : salaryBasis === 'monthly'
        ? `कुल कमाई (Gross) = हाजिरी ${summary.totalAttendanceUnits} × दैनिक दर (${currencyFormat(summary.labour.monthlySalary)} / ${summary.monthDays}) ${currencyFormat(summary.effectiveDailyRate)} = ${currencyFormat(summary.grossAmount)}`
        : `कुल कमाई (Gross) = हाजिरी ${summary.totalAttendanceUnits} × दैनिक वेतन ${currencyFormat(summary.labour.dailyFixedAmount)} = ${currencyFormat(summary.grossAmount)}`;
  const finalCalculationLine = `अंतिम देय (Final) = Gross ${currencyFormat(summary.grossAmount)} + Extra ${currencyFormat(summary.extraAmount)} - Canteen ${currencyFormat(summary.canteenTotal)} - Advance ${currencyFormat(summary.advanceTotal)} = ${currencyFormat(summary.finalPayable)}`;
  const printRateLine =
    labourType === 'contract_based'
      ? `Rate: ${currencyFormat(summary.labour.perPlyRate)} per ply`
      : salaryBasis === 'monthly'
        ? `Monthly Salary: ${currencyFormat(summary.labour.monthlySalary)} | Daily (${summary.monthDays}): ${currencyFormat(summary.effectiveDailyRate)}`
        : `Daily Salary: ${currencyFormat(summary.labour.dailyFixedAmount)}`;
  const printGeneratedOn = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  const dailyPlyLogs = summary.dailyPlyLogs || [];

  return (
    <section className="space-y-5">
      <div className="no-print space-y-5">
      <Card className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-primary-100/70 blur-3xl dark:bg-primary-900/25" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-44 w-44 rounded-full bg-sky-100/75 blur-3xl dark:bg-sky-900/25" />

        <div className="relative space-y-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <Link
                to={selfMode ? '/my-profile' : '/labours'}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-white dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {selfMode ? 'My Profile' : 'Back to Labour Directory'}
              </Link>

              <div className="mt-3 flex items-start gap-3">
                {summary.labour.profileImage ? (
                  <img
                    src={summary.labour.profileImage}
                    alt={summary.labour.name}
                    className="h-12 w-12 rounded-2xl border border-sky-200 object-cover shadow-sm dark:border-slate-700"
                  />
                ) : (
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-700 text-lg font-bold text-white">
                    {getNameInitial(summary.labour.name)}
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 sm:text-2xl">{summary.labour.name}</h2>
                  <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                    <Phone className="h-4 w-4" />
                    {summary.labour.phone}
                  </p>
                  {summary.labour.section ? (
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-300">
                      Section: {summary.labour.section}
                    </p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-primary-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary-700 dark:border-primary-800 dark:bg-primary-900/30 dark:text-primary-200">
                      {labourType === 'contract_based' ? <Layers3 className="h-3.5 w-3.5" /> : <BriefcaseBusiness className="h-3.5 w-3.5" />}
                      {getLabourTypeLabel(labourType)}
                    </span>
                    {labourType === 'salary_based' ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-sky-700 dark:border-sky-800 dark:bg-sky-900/30 dark:text-sky-200">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {getSalaryBasisLabel(salaryBasis)}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full rounded-2xl border border-slate-200/80 bg-white/80 p-3 dark:border-slate-700 dark:bg-slate-900/70 xl:w-[430px]">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Month</span>
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900"
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
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Year</span>
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900"
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

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <Button
                  variant="secondary"
                  className="gap-2 border-slate-300 bg-white/95 text-slate-700 shadow-sm hover:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  onClick={handlePrint}
                >
                  <Printer className="h-4 w-4" />
                  Print
                </Button>
                <Button
                  className="gap-2 bg-gradient-to-r from-primary-700 via-sky-600 to-cyan-500 text-white shadow-[0_10px_24px_rgba(2,132,199,0.32)] hover:from-primary-800 hover:via-sky-700 hover:to-cyan-600"
                  onClick={handleDownloadPDF}
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <HeaderStat label="Selected Month" value={`${monthLabel} ${year}`} icon={CalendarDays} tone="info" />
            <HeaderStat label={rateLabel} value={currencyFormat(rateValue)} icon={Wallet} />
            {labourType === 'salary_based' && salaryBasis === 'monthly' ? (
              <HeaderStat
                label={`Daily Rate (${summary.monthDays} Days)`}
                value={currencyFormat(summary.effectiveDailyRate)}
                icon={Clock3}
              />
            ) : labourType === 'contract_based' ? (
              <div className="rounded-2xl border border-sky-200/80 bg-sky-50/75 px-3 py-2.5 dark:border-sky-900/50 dark:bg-sky-900/20">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-200">
                      Total Ply (Month)
                    </p>
                    <p className="mt-1 text-lg font-bold text-sky-900 dark:text-sky-100">{summary.totalPly}</p>
                  </div>
                  <Button
                    variant="secondary"
                    className="h-8 rounded-lg px-2.5 py-1 text-xs font-semibold"
                    onClick={() => setIsPlyLogModalOpen(true)}
                  >
                    <Eye className="mr-1 h-3.5 w-3.5" />
                    View More
                  </Button>
                </div>
                <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-300">Date-wise ply details</p>
              </div>
            ) : (
              <HeaderStat
                label={labourType === 'contract_based' ? 'Total Ply (Month)' : 'Attendance Unit'}
                value={labourType === 'contract_based' ? summary.totalPly : summary.totalAttendanceUnits}
              />
            )}
            <HeaderStat label="Final Payable" value={currencyFormat(summary.finalPayable)} tone="success" icon={Wallet} />
          </div>
        </div>
      </Card>

      {isLabourViewer ? (
        <Card className="relative overflow-hidden border-2 border-primary-300/80 bg-gradient-to-b from-white via-sky-50/70 to-cyan-50/70 dark:border-primary-700/70 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary-200/60 blur-3xl dark:bg-primary-900/30" />
          <div className="relative space-y-4">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 sm:text-2xl">
                मेरा मासिक हिसाब / My Monthly Summary
              </h3>
              <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-300">
                सरल और साफ गणना | Simple and clear monthly calculation
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl border border-primary-200 bg-white/95 p-5 text-center shadow-sm dark:border-primary-800 dark:bg-slate-900/80">
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{attendanceLabel}</p>
                <p className="mt-2 text-5xl font-black leading-none text-primary-700 dark:text-primary-300 sm:text-6xl">
                  {attendanceValue}
                </p>
                <p className="mt-3 text-lg font-bold text-slate-800 dark:text-slate-100">
                  {summary.totalPresentDays} / {summary.monthDays} दिन
                </p>
              </div>

              <div className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-5 text-center shadow-sm dark:border-emerald-900/60 dark:bg-emerald-900/20">
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-200">
                  अंतिम देय / Final Payable
                </p>
                <p className="mt-2 text-5xl font-black leading-none text-emerald-700 dark:text-emerald-200 sm:text-6xl">
                  {currencyFormat(summary.finalPayable)}
                </p>
                <p className="mt-3 text-base font-semibold text-amber-700 dark:text-amber-300">
                  {summary.duesOnLabour > 0
                    ? `बकाया (Dues): ${currencyFormat(summary.duesOnLabour)}`
                    : 'कोई बकाया नहीं / No dues'}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-sky-200 bg-white/90 p-4 dark:border-sky-900/60 dark:bg-slate-900/70">
              <p className="text-sm font-bold uppercase tracking-wide text-sky-700 dark:text-sky-200">साफ गणना / Clear Calculation</p>
              <p className="mt-2 text-base font-semibold text-slate-800 dark:text-slate-100">{grossCalculationLine}</p>
              <p className="mt-2 text-base font-semibold text-slate-800 dark:text-slate-100">{finalCalculationLine}</p>
            </div>
          </div>
        </Card>
      ) : (
        <BillingSummaryCard summary={summary} />
      )}

      {!isLabourViewer ? (
        <Card className="relative overflow-hidden">
          <div className="pointer-events-none absolute -right-16 -top-10 h-36 w-36 rounded-full bg-sky-100/70 blur-3xl dark:bg-sky-900/20" />
          <div className="relative">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Adjustments</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Add canteen, advance, and extra entries for this month.
              </p>
              <p className="mt-2 inline-flex rounded-full border border-primary-200 bg-primary-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary-700 dark:border-primary-800 dark:bg-primary-900/30 dark:text-primary-200">
                3 Dedicated Adjustment Cards
              </p>
              {!canManageAdjustments ? (
                <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-200">
                  Manager role has read-only access to adjustments.
                </p>
              ) : null}
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <AdjustmentPanel
                index="01"
                title="Canteen"
                subtitle="Deduction entries from canteen usage."
                icon={UtensilsCrossed}
                tone="blue"
                stats={[{ label: 'Current Total', value: currencyFormat(summary.canteenTotal) }]}
              >
                <Input
                  label="Amount"
                  type="number"
                  min="0"
                  value={canteenForm.amount}
                  onChange={(event) => setCanteenForm((prev) => ({ ...prev, amount: event.target.value }))}
                  disabled={!canManageAdjustments}
                />
                <Input
                  label="Date"
                  type="date"
                  value={canteenForm.date}
                  onChange={(event) => setCanteenForm((prev) => ({ ...prev, date: event.target.value }))}
                  disabled={!canManageAdjustments}
                />
                <PanelActionButton
                  label="Add Canteen Entry"
                  tone="blue"
                  onClick={handleAddCanteen}
                  disabled={!canManageAdjustments}
                  isLoading={isAddingCanteen}
                />
              </AdjustmentPanel>

              <AdjustmentPanel
                index="02"
                title="Advance Taken"
                subtitle="Advance amount provided to labour."
                icon={HandCoins}
                tone="emerald"
                stats={[{ label: 'Current Total', value: currencyFormat(summary.advanceTotal) }]}
              >
                <Input
                  label="Amount"
                  type="number"
                  min="0"
                  value={advanceForm.amount}
                  onChange={(event) => setAdvanceForm((prev) => ({ ...prev, amount: event.target.value }))}
                  disabled={!canManageAdjustments}
                />
                <Input
                  label="Date"
                  type="date"
                  value={advanceForm.date}
                  onChange={(event) => setAdvanceForm((prev) => ({ ...prev, date: event.target.value }))}
                  disabled={!canManageAdjustments}
                />
                <PanelActionButton
                  label="Add Advance Entry"
                  tone="emerald"
                  onClick={handleAddAdvance}
                  disabled={!canManageAdjustments}
                  isLoading={isAddingAdvance}
                />
              </AdjustmentPanel>

              <AdjustmentPanel
                index="03"
                title={extraLabel}
                subtitle={
                  labourType === 'contract_based'
                    ? 'Add extra ply output entries.'
                    : 'Add extra hours like night shift work.'
                }
                icon={BadgeDollarSign}
                tone="amber"
                stats={[
                  {
                    label: labourType === 'contract_based' ? 'Month Extra Ply' : 'Month Extra Hours',
                    value: labourType === 'contract_based' ? summary.extraPlyTotal : summary.extraHoursTotal
                  },
                  { label: 'Extra Amount', value: currencyFormat(summary.extraAmount) }
                ]}
              >
                <Input
                  label={extraLabel}
                  type="number"
                  min="0"
                  step="0.5"
                  value={extraForm.quantity}
                  onChange={(event) => setExtraForm((prev) => ({ ...prev, quantity: event.target.value }))}
                  disabled={!canManageAdjustments}
                />
                <Input
                  label="Date"
                  type="date"
                  value={extraForm.date}
                  onChange={(event) => setExtraForm((prev) => ({ ...prev, date: event.target.value }))}
                  disabled={!canManageAdjustments}
                />
                <Input
                  label="Note (Optional)"
                  value={extraForm.note}
                  onChange={(event) => setExtraForm((prev) => ({ ...prev, note: event.target.value }))}
                  disabled={!canManageAdjustments}
                />
                <PanelActionButton
                  label="Add Extra Entry"
                  tone="amber"
                  onClick={handleAddExtra}
                  disabled={!canManageAdjustments}
                  isLoading={isAddingExtra}
                />
              </AdjustmentPanel>
            </div>
          </div>
        </Card>
      ) : null}

      {!isLabourViewer ? (
        <>
          <EntrySection
            title="Canteen Entries"
            subtitle="All canteen deductions added for this month."
            columns={[
              { key: 'date', label: 'Date', render: (row) => formatDate(row.date) },
              { key: 'amount', label: 'Amount', render: (row) => currencyFormat(row.amount) },
              { key: 'by', label: 'Added By', render: (row) => row.addedBy?.name || '-' }
            ]}
            rows={summary.canteenEntries || []}
            emptyMessage="No canteen entries."
          />

          <EntrySection
            title="Advance Entries"
            subtitle="Advance payments recorded with date and actor."
            columns={[
              { key: 'date', label: 'Date', render: (row) => formatDate(row.date) },
              { key: 'amount', label: 'Amount', render: (row) => currencyFormat(row.amount) },
              { key: 'by', label: 'Given By', render: (row) => row.givenBy?.name || '-' }
            ]}
            rows={summary.advanceEntries || []}
            emptyMessage="No advance entries."
          />

          <EntrySection
            title="Extra Entries"
            subtitle="Extra attendance/ply entries and notes."
            columns={[
              { key: 'date', label: 'Date', render: (row) => formatDate(row.date) },
              { key: 'type', label: 'Type', render: (row) => (row.type === 'hours' ? 'Extra Hours' : 'Extra Ply') },
              { key: 'quantity', label: 'Quantity', render: (row) => row.quantity },
              { key: 'note', label: 'Note', render: (row) => row.note || '-' },
              { key: 'by', label: 'Added By', render: (row) => row.addedBy?.name || '-' }
            ]}
            rows={summary.extraEntries || []}
            emptyMessage="No extra entries."
          />
        </>
      ) : null}
      </div>

      <article className="print-only labour-print-sheet">
        <div className="labour-print-header">
          <div>
            <p className="labour-print-eyebrow">Labour Attendance & Billing</p>
            <h1>Monthly Billing Statement</h1>
            <p>{monthLabel} {year}</p>
          </div>
          <div className="labour-print-pill">
            <span>Final Payable</span>
            <strong>{currencyFormat(summary.finalPayable)}</strong>
          </div>
        </div>

        <div className="labour-print-meta">
          <div>
            <p className="label">Name</p>
            <p className="value">{summary.labour.name}</p>
          </div>
          <div>
            <p className="label">Phone</p>
            <p className="value">{summary.labour.phone}</p>
          </div>
          <div>
            <p className="label">Section</p>
            <p className="value">{summary.labour.section || '-'}</p>
          </div>
          <div>
            <p className="label">Category</p>
            <p className="value">{getLabourTypeLabel(labourType)}</p>
          </div>
          <div>
            <p className="label">Rate</p>
            <p className="value">{printRateLine}</p>
          </div>
        </div>

        <div className="labour-print-grid">
          <div className="labour-print-stat labour-print-stat--blue">
            <p>कुल हाजिरी / Total Attendance</p>
            <h2>{attendanceValue}</h2>
          </div>
          <div className="labour-print-stat labour-print-stat--green">
            <p>कुल दिन / महीने के दिन</p>
            <h2>{summary.totalPresentDays} / {summary.monthDays}</h2>
          </div>
        </div>

        <div className="labour-print-calc">
          <h3>Calculation</h3>
          <p>{grossCalculationLine}</p>
          <p>{finalCalculationLine}</p>
        </div>

        <div className="labour-print-amounts">
          <div><span>Gross</span><strong>{currencyFormat(summary.grossAmount)}</strong></div>
          <div><span>Extra</span><strong>{currencyFormat(summary.extraAmount)}</strong></div>
          <div><span>Canteen</span><strong>{currencyFormat(summary.canteenTotal)}</strong></div>
          <div><span>Advance</span><strong>{currencyFormat(summary.advanceTotal)}</strong></div>
          <div><span>Dues</span><strong>{currencyFormat(summary.duesOnLabour)}</strong></div>
          <div className="final"><span>Final Payable</span><strong>{currencyFormat(summary.finalPayable)}</strong></div>
        </div>

        <p className="labour-print-footer">Generated on {printGeneratedOn}</p>
      </article>

      <Modal title="Date-wise Ply Details" isOpen={isPlyLogModalOpen} onClose={() => setIsPlyLogModalOpen(false)}>
        <div className="space-y-3">
          <div className="rounded-xl border border-sky-200/80 bg-sky-50/70 px-3 py-2 text-sm font-semibold text-sky-800 dark:border-sky-900/50 dark:bg-sky-900/20 dark:text-sky-200">
            Total Ply: {summary.totalPly}
          </div>

          {dailyPlyLogs.length === 0 ? (
            <p className="rounded-xl border border-slate-200/80 bg-white/80 px-3 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
              No daily ply entries for selected month.
            </p>
          ) : (
            <>
              <div className="space-y-2 md:hidden">
                {dailyPlyLogs.map((entry, index) => (
                  <article
                    key={`${entry.date}-${index}`}
                    className="rounded-xl border border-slate-200/80 bg-white/90 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900/70"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{formatDate(entry.date)}</p>
                      <p className="text-base font-bold text-primary-700 dark:text-primary-300">{entry.ply}</p>
                    </div>
                    <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {entry.status}
                    </p>
                  </article>
                ))}
              </div>

              <div className="hidden md:block">
                <div className="table-shell rounded-xl">
                  <table className="data-table min-w-[420px]">
                    <thead>
                      <tr>
                        <th className="px-2 py-2">Date</th>
                        <th className="px-2 py-2">Status</th>
                        <th className="px-2 py-2">Ply</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyPlyLogs.map((entry, index) => (
                        <tr key={`${entry.date}-${index}`}>
                          <td className="px-2 py-2 text-sm">{formatDate(entry.date)}</td>
                          <td className="px-2 py-2 text-sm capitalize">{entry.status}</td>
                          <td className="px-2 py-2 text-sm font-semibold text-primary-700 dark:text-primary-300">
                            {entry.ply}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </Modal>
    </section>
  );
}

export default LabourProfilePage;
