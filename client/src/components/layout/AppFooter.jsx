function AppFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-6">
      <div className="rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-3 text-xs text-slate-600 shadow-soft backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300 sm:flex sm:items-center sm:justify-between sm:text-sm">
        <p className="font-medium">© {year} Labour Attendance & Billing Management System</p>
        <p className="mt-1 text-slate-500 dark:text-slate-400 sm:mt-0">Built for attendance, billing, and reporting workflows.</p>
      </div>
    </footer>
  );
}

export default AppFooter;
