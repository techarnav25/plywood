import { useEffect, useState } from 'react';
import {
  BarChart3,
  Eye,
  EyeOff,
  Factory,
  HardHat,
  LockKeyhole,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UserCog,
  Wrench
} from 'lucide-react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Card from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import Spinner from '../components/common/Spinner.jsx';
import { useAuth } from '../hooks/useAuth.js';

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { admin, login, isAuthenticated, isAuthLoading } = useAuth();

  const [loginMode, setLoginMode] = useState('admin');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [motion, setMotion] = useState({
    x: 50,
    y: 50,
    tiltX: 0,
    tiltY: 0
  });

  useEffect(() => {
    document.title = 'Login | Labour Attendance';
  }, []);

  if (!isAuthLoading && isAuthenticated) {
    const defaultPath = admin?.role === 'labour' ? '/my-profile' : '/dashboard';
    return <Navigate to={location.state?.from?.pathname || defaultPath} replace />;
  }

  const validate = () => {
    const nextErrors = {};

    if (loginMode === 'admin' && !email.trim()) nextErrors.email = 'Email is required';
    if (loginMode === 'labour' && !phone.trim()) nextErrors.phone = 'Mobile number is required';
    if (!password.trim()) nextErrors.password = 'Password is required';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) return;

    try {
      setIsSubmitting(true);
      await login(
        loginMode === 'labour'
          ? { mode: 'labour', phone, password }
          : { mode: 'admin', email, password }
      );

      const defaultPath = loginMode === 'labour' ? '/my-profile' : '/dashboard';
      const redirectPath = location.state?.from?.pathname || defaultPath;
      navigate(redirectPath, { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to login');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMouseMove = (event) => {
    const { currentTarget, clientX, clientY } = event;
    const rect = currentTarget.getBoundingClientRect();
    const relativeX = ((clientX - rect.left) / rect.width) * 100;
    const relativeY = ((clientY - rect.top) / rect.height) * 100;

    const clampedX = Math.max(0, Math.min(100, relativeX));
    const clampedY = Math.max(0, Math.min(100, relativeY));

    const tiltY = ((clampedX - 50) / 50) * 5.5;
    const tiltX = ((50 - clampedY) / 50) * 5.5;

    setMotion({
      x: clampedX,
      y: clampedY,
      tiltX,
      tiltY
    });
  };

  const resetMotion = () => {
    setMotion({
      x: 50,
      y: 50,
      tiltX: 0,
      tiltY: 0
    });
  };

  return (
    <div
      className="auth-shell relative min-h-screen overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={resetMotion}
      style={{
        '--mx': `${motion.x}%`,
        '--my': `${motion.y}%`
      }}
    >
      <div className="auth-grid-overlay pointer-events-none absolute inset-0" />
      <div className="auth-spotlight pointer-events-none absolute inset-0" />
      <div className="auth-beam auth-beam--one" />
      <div className="auth-beam auth-beam--two" />

      <div className="auth-orb auth-orb--one" />
      <div className="auth-orb auth-orb--two" />
      <div className="auth-orb auth-orb--three" />
      <div className="auth-gear auth-gear--one" />
      <div className="auth-gear auth-gear--two" />
      <div className="auth-rings">
        <span />
        <span />
        <span />
      </div>

      <div className="relative mx-auto grid min-h-screen w-full max-w-6xl items-center gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[1.08fr,0.92fr] lg:px-8">
        <section className="auth-hero hidden lg:block">
          <div className="auth-hero-badge">
            <Sparkles className="h-4 w-4" />
            Secure Workforce Platform
          </div>
          <h1 className="auth-hero-title">
            Labour Attendance
            <br />
            & Billing System
          </h1>
          <p className="auth-hero-subtitle">
            Real-time attendance, payroll accuracy, and role-based control in one modern dashboard.
          </p>

          <div className="auth-kpi-strip mt-5">
            <div className="auth-kpi-item">
              <Factory className="h-4 w-4" />
              <span>Site Ops</span>
            </div>
            <div className="auth-kpi-item">
              <Wrench className="h-4 w-4" />
              <span>Live Attendance</span>
            </div>
            <div className="auth-kpi-item">
              <BarChart3 className="h-4 w-4" />
              <span>Accurate Billing</span>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="auth-hero-tile auth-float">
              <div className="auth-hero-icon">
                <UserCog className="h-4 w-4" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Multi Role Access</p>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">Super Admin / Admin / Manager / Labour</p>
            </div>

            <div className="auth-hero-tile auth-float auth-float-delay">
              <div className="auth-hero-icon">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Secure Sessions</p>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">JWT authentication with protected routes</p>
            </div>
          </div>

          <div className="auth-marquee mt-6">
            <div className="auth-marquee-track">
              <span>Attendance</span>
              <span>Billing</span>
              <span>Roles</span>
              <span>Reports</span>
              <span>Security</span>
              <span>Attendance</span>
              <span>Billing</span>
              <span>Roles</span>
              <span>Reports</span>
              <span>Security</span>
            </div>
          </div>
        </section>

        <Card
          className="auth-login-card relative w-full max-w-md justify-self-center overflow-hidden p-0 sm:p-0"
          style={{
            transform: `perspective(1200px) rotateX(${motion.tiltX}deg) rotateY(${motion.tiltY}deg)`
          }}
        >
          <div className="auth-login-topband" />

          <div className="auth-login-inner p-5 sm:p-6">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full border border-primary-200/70 bg-primary-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary-700 dark:border-primary-800/70 dark:bg-primary-900/30 dark:text-primary-200">
                <LockKeyhole className="h-3.5 w-3.5" />
                Authorized Login
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-[1.75rem]">
                {loginMode === 'labour' ? 'Labour Access' : 'Admin Control Panel'}
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {loginMode === 'labour'
                  ? 'Login with mobile number and password'
                  : 'Login with email and password'}
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="relative grid grid-cols-2 rounded-2xl border border-slate-200/80 bg-slate-100/85 p-1 dark:border-slate-700 dark:bg-slate-800/85">
                <span
                  className="pointer-events-none absolute left-1 top-1 h-[calc(100%-0.5rem)] w-[calc(50%-0.25rem)] rounded-xl bg-gradient-to-r from-primary-700 to-sky-600 shadow-[0_10px_24px_rgba(14,116,190,0.35)] transition-transform duration-300"
                  style={{
                    transform: `translateX(${loginMode === 'admin' ? '0%' : '100%'})`
                  }}
                />
                <button
                  type="button"
                  className={`relative z-10 flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                    loginMode === 'admin' ? 'text-white' : 'text-slate-600 dark:text-slate-200'
                  }`}
                  onClick={() => {
                    setLoginMode('admin');
                    setErrors({});
                  }}
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Admin
                </button>
                <button
                  type="button"
                  className={`relative z-10 flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                    loginMode === 'labour' ? 'text-white' : 'text-slate-600 dark:text-slate-200'
                  }`}
                  onClick={() => {
                    setLoginMode('labour');
                    setErrors({});
                  }}
                >
                  <HardHat className="h-3.5 w-3.5" />
                  Labour
                </button>
              </div>

              {loginMode === 'admin' ? (
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                    Email
                  </span>
                  <div className="relative">
                    <UserCog className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="w-full rounded-xl border border-slate-200/80 bg-white/90 py-2.5 pl-9 pr-3 text-sm text-slate-900 shadow-sm outline-none transition duration-200 placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-primary-900"
                      placeholder="admin@example.com"
                    />
                  </div>
                  {errors.email ? <p className="mt-1 text-xs text-rose-600">{errors.email}</p> : null}
                </label>
              ) : (
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                    Mobile Number
                  </span>
                  <div className="relative">
                    <Smartphone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      className="w-full rounded-xl border border-slate-200/80 bg-white/90 py-2.5 pl-9 pr-3 text-sm text-slate-900 shadow-sm outline-none transition duration-200 placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-primary-900"
                      placeholder="Enter registered mobile number"
                    />
                  </div>
                  {errors.phone ? <p className="mt-1 text-xs text-rose-600">{errors.phone}</p> : null}
                </label>
              )}

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                  Password
                </span>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-xl border border-slate-200/80 bg-white/90 py-2.5 pl-9 pr-10 text-sm text-slate-900 shadow-sm outline-none transition duration-200 placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-primary-900"
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-2 inline-flex items-center text-slate-500"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password ? <p className="mt-1 text-xs text-rose-600">{errors.password}</p> : null}
              </label>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-primary-700 via-sky-600 to-cyan-500 text-white shadow-[0_14px_30px_rgba(2,132,199,0.32)] hover:from-primary-800 hover:via-sky-700 hover:to-cyan-600"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner className="h-4 w-4" /> Authenticating...
                  </span>
                ) : loginMode === 'labour' ? (
                  'Login as Labour'
                ) : (
                  'Login as Admin'
                )}
              </Button>
            </form>

            <div className="mt-4 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-2.5 text-[11px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300">
              {loginMode === 'labour'
                ? 'Labour access: view own profile, attendance and billing details.'
                : 'Admin access: attendance operations, billing control and reports.'}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default LoginPage;
