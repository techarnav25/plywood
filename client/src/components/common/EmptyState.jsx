function EmptyState({ message = 'No data found' }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300/80 bg-slate-50/70 px-5 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
      {message}
    </div>
  );
}

export default EmptyState;
