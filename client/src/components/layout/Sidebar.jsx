import { BarChart3, ClipboardCheck, LogOut, UserSquare2, Users, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import Button from '../common/Button.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { ADMIN_ROLES } from '../../utils/constants.js';

const baseLinks = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: ClipboardCheck,
    roles: [ADMIN_ROLES.SUPER_ADMIN, ADMIN_ROLES.ADMIN, ADMIN_ROLES.MANAGER]
  },
  {
    to: '/labours',
    label: 'Labours',
    icon: Users,
    roles: [ADMIN_ROLES.SUPER_ADMIN, ADMIN_ROLES.ADMIN, ADMIN_ROLES.MANAGER]
  },
  {
    to: '/reports',
    label: 'Reports',
    icon: BarChart3,
    roles: [ADMIN_ROLES.SUPER_ADMIN, ADMIN_ROLES.ADMIN, ADMIN_ROLES.MANAGER]
  },
  {
    to: '/my-profile',
    label: 'My Profile',
    icon: UserSquare2,
    roles: [ADMIN_ROLES.LABOUR]
  }
];

const getNameInitial = (name = '') => {
  const trimmed = String(name || '').trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : 'A';
};

function NavItem({ to, icon: Icon, label, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) => {
        const activeClasses =
          'bg-gradient-to-r from-primary-700 via-sky-600 to-cyan-500 text-white shadow-[0_12px_28px_rgba(2,132,199,0.35)]';
        const idleClasses =
          'text-slate-700 hover:bg-white/85 hover:text-primary-700 dark:text-slate-200 dark:hover:bg-slate-800/80';

        return `group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition duration-200 ${isActive ? activeClasses : idleClasses} lg:rounded-xl lg:py-2.5`;
      }}
    >
      {({ isActive }) => (
        <>
          <span
            className={`inline-flex h-8 w-8 items-center justify-center rounded-xl transition ${
              isActive
                ? 'bg-white/20 text-white'
                : 'bg-sky-100 text-primary-700 group-hover:bg-sky-50 dark:bg-slate-700 dark:text-slate-100 dark:group-hover:bg-slate-600'
            }`}
          >
            <Icon className="h-4 w-4" />
          </span>
          {label}
        </>
      )}
    </NavLink>
  );
}

function Sidebar({ isOpen, onClose }) {
  const { admin, logout } = useAuth();

  const links = baseLinks.filter((link) => link.roles.includes(admin?.role));

  return (
    <>
      {isOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-20 bg-gradient-to-b from-slate-950/55 via-slate-950/45 to-sky-950/55 backdrop-blur-[2px] lg:hidden"
          onClick={onClose}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-30 w-[86vw] max-w-[330px] transform overflow-hidden rounded-r-3xl border-r border-sky-200/60 bg-gradient-to-b from-white/95 via-sky-50/92 to-cyan-100/80 p-5 shadow-[0_26px_56px_rgba(2,6,23,0.22)] backdrop-blur-xl transition duration-300 dark:border-slate-700 dark:from-slate-900/95 dark:via-slate-900/94 dark:to-blue-950/35 lg:w-72 lg:max-w-none lg:rounded-none lg:border-slate-200/70 lg:bg-white/92 lg:shadow-soft lg:duration-200 lg:dark:border-slate-700 lg:dark:bg-slate-900/92 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="pointer-events-none absolute -left-8 top-24 h-36 w-36 rounded-full bg-cyan-200/40 blur-3xl dark:bg-cyan-900/25" />
        <div className="pointer-events-none absolute -right-8 top-8 h-40 w-40 rounded-full bg-sky-200/40 blur-3xl dark:bg-primary-900/20" />

        <div className="relative mb-7 rounded-2xl border border-white/75 bg-white/75 p-4 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/70 lg:mb-8 lg:border-slate-200/70 lg:bg-gradient-to-br lg:from-primary-50 lg:via-white lg:to-primary-100 lg:dark:border-slate-700 lg:dark:from-slate-900 lg:dark:via-slate-900 lg:dark:to-slate-800">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary-700 text-lg font-bold text-white">
              LA
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-sky-200 bg-white/90 text-primary-700 transition hover:bg-white dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 lg:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Labour System</p>
          <h1 className="mt-1 text-lg font-bold text-primary-900 dark:text-primary-300">Attendance & Billing</h1>
          <div className="mt-3 h-1.5 w-24 rounded-full bg-gradient-to-r from-primary-600 via-sky-500 to-cyan-500" />
        </div>

        <nav className="relative space-y-2 rounded-2xl border border-white/80 bg-white/55 p-2 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/55 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0">
          {links.map((link) => (
            <NavItem key={link.to} {...link} onClick={onClose} />
          ))}
        </nav>

        <div className="relative mt-7 rounded-2xl border border-white/80 bg-white/75 p-3 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/70 lg:mt-8 lg:rounded-xl lg:border-slate-200/70 lg:bg-slate-50/80 lg:dark:border-slate-700 lg:dark:bg-slate-800/80">
          <div className="flex items-center gap-2.5">
            {admin?.profileImage ? (
              <img
                src={admin.profileImage}
                alt={admin?.name || 'Admin'}
                className="h-10 w-10 rounded-full border border-sky-200 object-cover dark:border-slate-600"
              />
            ) : (
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary-700 text-sm font-bold text-white">
                {getNameInitial(admin?.name)}
              </span>
            )}
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{admin?.name}</p>
              <p className="mt-1 inline-flex rounded-full border border-primary-200 bg-primary-100/80 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-700 dark:border-primary-800 dark:bg-primary-900/40 dark:text-primary-200">
                {admin?.role?.replace('_', ' ')}
              </p>
            </div>
          </div>
        </div>

        <Button
          variant="secondary"
          className="mt-4 w-full gap-2 border-slate-300 bg-white/90 text-slate-800 hover:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          onClick={() => {
            logout();
            onClose();
          }}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </aside>
    </>
  );
}

export default Sidebar;
