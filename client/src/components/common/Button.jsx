const variants = {
  primary:
    'bg-primary-700 text-white hover:bg-primary-800 focus:ring-primary-300 dark:bg-primary-500 dark:hover:bg-primary-400',
  secondary:
    'border border-primary-100 bg-white text-primary-700 hover:bg-primary-50 focus:ring-primary-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700',
  danger:
    'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-300',
  ghost:
    'bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-200 dark:text-slate-100 dark:hover:bg-slate-800'
};

function Button({
  type = 'button',
  variant = 'primary',
  className = '',
  disabled = false,
  children,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold tracking-wide transition duration-200 hover:-translate-y-[1px] active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
