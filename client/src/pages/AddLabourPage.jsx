import { useState } from 'react';
import { ArrowLeft, CalendarClock, Layers3, UserPlus, Wallet } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import LabourForm from '../components/labour/LabourForm.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { labourService } from '../services/labourService.js';
import { ADMIN_ROLES } from '../utils/constants.js';

const setupHighlights = [
  {
    icon: Wallet,
    title: 'Salary Based Setup',
    description: 'Choose daily or monthly salary mode with attendance-based calculations.'
  },
  {
    icon: Layers3,
    title: 'Contract Based Setup',
    description: 'Track daily ply output and generate amount from per-ply rates.'
  },
  {
    icon: CalendarClock,
    title: 'Accurate Billing Logic',
    description: 'Supports 10-hour attendance unit and monthly salary day-wise conversion.'
  }
];

function AddLabourPage() {
  const { admin } = useAuth();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);

  if (admin?.role !== ADMIN_ROLES.SUPER_ADMIN) {
    return <Navigate to="/labours" replace />;
  }

  const handleCreateLabour = async (payload) => {
    try {
      setIsSaving(true);
      await labourService.createLabour(payload);
      toast.success('Labour added successfully');
      navigate('/labours');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to create labour');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="space-y-5">
      <div className="relative overflow-hidden rounded-3xl border border-primary-100/80 bg-gradient-to-br from-white via-primary-50/80 to-sky-100/80 p-4 shadow-soft dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 sm:p-5">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary-200/35 blur-3xl dark:bg-primary-900/35" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-52 w-52 rounded-full bg-sky-200/35 blur-3xl dark:bg-sky-900/25" />

        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Link
              to="/labours"
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/85 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:-translate-y-[1px] hover:bg-white dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Labour Directory
            </Link>
            <h1 className="mt-3 text-xl font-bold text-slate-900 dark:text-slate-100 sm:text-2xl">Add Labour</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
              Create a complete labour profile with salary or contract billing configuration.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 self-start rounded-2xl border border-primary-200 bg-white/80 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-primary-700 dark:border-primary-900 dark:bg-slate-900/80 dark:text-primary-200">
            <UserPlus className="h-4 w-4" />
            Super Admin Access
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_1.4fr]">
        <Card className="h-fit">
          <h2 className="text-sm font-bold uppercase tracking-wide text-primary-700 dark:text-primary-300">Setup Guide</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Follow these rules for reliable attendance and billing output.</p>

          <div className="mt-4 space-y-3">
            {setupHighlights.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-slate-200/70 bg-white/80 p-3 dark:border-slate-700 dark:bg-slate-900/80"
                >
                  <div className="flex gap-3">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-200">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.title}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 rounded-2xl border border-primary-100 bg-primary-50/80 p-3 text-xs text-primary-800 dark:border-primary-900 dark:bg-primary-900/20 dark:text-primary-200">
            Tip: For monthly salary labour, the daily amount is automatically based on the selected month day count.
          </div>
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Labour Details</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Fill required fields to create the labour record.</p>

          <div className="mt-4">
            <LabourForm onSubmit={handleCreateLabour} isSubmitting={isSaving} submitLabel="Create Labour" />
          </div>

          <div className="mt-3">
            <Button variant="ghost" className="w-full" onClick={() => navigate('/labours')}>
              Cancel
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
}

export default AddLabourPage;
