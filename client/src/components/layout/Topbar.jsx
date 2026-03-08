import { CalendarDays, MoonStar, Sun } from 'lucide-react';
import Button from '../common/Button.jsx';
import { useAuth } from '../../hooks/useAuth.js';

function Topbar({ isDarkMode, onToggleDarkMode }) {
  const { admin } = useAuth();

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  return (
    <header className="card-surface mb-5 flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="flex items-center gap-3">
        <div className="hidden h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-700 sm:flex dark:bg-primary-900/40 dark:text-primary-300">
          <CalendarDays className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Today</p>
          <p className="text-base font-semibold text-slate-900 dark:text-slate-100">{today}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Signed in as {admin?.name} ({admin?.role?.replace('_', ' ')})
          </p>
        </div>
      </div>

      <Button variant="secondary" className="w-full gap-2 sm:w-auto" onClick={onToggleDarkMode}>
        {isDarkMode ? <Sun className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
        {isDarkMode ? 'Light' : 'Dark'} Mode
      </Button>
    </header>
  );
}

export default Topbar;
