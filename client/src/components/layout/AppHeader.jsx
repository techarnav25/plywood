import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Camera, Loader2, Menu, MoonStar, Sun, Upload, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLocation } from 'react-router-dom';
import Button from '../common/Button.jsx';
import Modal from '../common/Modal.jsx';
import { useAuth } from '../../hooks/useAuth.js';

const getPageMeta = (pathname) => {
  if (pathname === '/dashboard') {
    return {
      title: 'Dashboard',
      subtitle: 'Track daily attendance, hours, and production output.'
    };
  }

  if (pathname === '/labours') {
    return {
      title: 'Labours',
      subtitle: 'Manage labour profiles and access controls.'
    };
  }

  if (pathname === '/labours/add') {
    return {
      title: 'Add Labour',
      subtitle: 'Create labour profile with salary or contract billing setup.'
    };
  }

  if (pathname === '/reports') {
    return {
      title: 'Reports',
      subtitle: 'View monthly billing, totals, dues, and payouts.'
    };
  }

  if (pathname.startsWith('/labour/')) {
    return {
      title: 'Labour Profile',
      subtitle: 'Review monthly summary, adjustments, and printable details.'
    };
  }

  if (pathname === '/my-profile') {
    return {
      title: 'My Profile',
      subtitle: 'View your monthly summary, attendance, and billing details.'
    };
  }

  return {
    title: 'Labour Management',
    subtitle: 'Attendance and billing operations.'
  };
};

const getNameInitial = (name = '') => {
  const trimmed = String(name || '').trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : 'A';
};

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Unable to read file'));
    reader.readAsDataURL(file);
  });

const optimizeImageFile = async (file) => {
  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files are allowed');
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Image must be less than 5MB');
  }

  const fileDataUrl = await readFileAsDataUrl(file);

  const img = await new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Invalid image file'));
    image.src = fileDataUrl;
  });

  const maxSize = 320;
  const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Unable to process image');
  }

  context.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', 0.82);
};

function AppHeader({ isDarkMode, onToggleDarkMode, onToggleSidebar }) {
  const { admin, updateProfileImage } = useAuth();
  const location = useLocation();

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileDraft, setProfileDraft] = useState('');
  const [profileUrlInput, setProfileUrlInput] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  const pageMeta = getPageMeta(location.pathname);
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const currentProfileImage = admin?.profileImage || '';
  const canEditProfileImage = Boolean(admin);
  const normalizedDraft = profileDraft.trim();
  const hasChanges = normalizedDraft !== currentProfileImage;

  const previewImage = useMemo(() => normalizedDraft || '', [normalizedDraft]);

  useEffect(() => {
    if (!isProfileModalOpen) {
      setProfileDraft(currentProfileImage);
      setProfileUrlInput(currentProfileImage.startsWith('http') ? currentProfileImage : '');
    }
  }, [currentProfileImage, isProfileModalOpen]);

  const handleOpenEditor = () => {
    setProfileDraft(currentProfileImage);
    setProfileUrlInput(currentProfileImage.startsWith('http') ? currentProfileImage : '');
    setIsProfileModalOpen(true);
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    try {
      setIsProcessingFile(true);
      const optimizedImage = await optimizeImageFile(file);
      setProfileDraft(optimizedImage);
      setProfileUrlInput('');
      toast.success('Image ready');
    } catch (error) {
      toast.error(error.message || 'Unable to process image');
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsSavingProfile(true);
      await updateProfileImage(normalizedDraft);
      toast.success(normalizedDraft ? 'Profile picture updated' : 'Profile picture removed');
      setIsProfileModalOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to update profile picture');
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-20 mb-5 overflow-hidden rounded-2xl border border-sky-200/70 bg-gradient-to-r from-white via-sky-50 to-blue-100/90 shadow-[0_16px_44px_rgba(15,23,42,0.09)] backdrop-blur-sm dark:border-slate-700/80 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/30">
        <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-cyan-200/50 blur-2xl dark:bg-cyan-900/20" />
        <div className="pointer-events-none absolute -left-12 bottom-0 h-24 w-24 rounded-full bg-primary-200/45 blur-2xl dark:bg-primary-900/25" />

        <div className="relative flex flex-col gap-3 px-3 py-3 sm:px-5 sm:py-4">
          <div className="flex items-start gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={onToggleSidebar}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-700 text-white shadow-sm transition hover:bg-primary-800 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>

            <div className="mt-0.5 hidden h-9 w-9 items-center justify-center rounded-xl bg-white/90 text-primary-700 shadow-sm sm:flex dark:bg-slate-800 dark:text-primary-300">
              <CalendarDays className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold text-slate-900 dark:text-slate-100 sm:text-lg">{pageMeta.title}</h1>
              <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-300 sm:text-sm">{pageMeta.subtitle}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">{today}</p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={canEditProfileImage ? handleOpenEditor : undefined}
                className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/85 px-1.5 py-1 pr-2 text-[11px] font-semibold text-slate-700 transition hover:bg-white dark:border-slate-700 dark:bg-slate-900/75 dark:text-slate-200"
                title={canEditProfileImage ? 'Update profile picture' : 'Profile'}
                disabled={!canEditProfileImage}
              >
                {currentProfileImage ? (
                  <img
                    src={currentProfileImage}
                    alt={admin?.name || 'Admin'}
                    className="h-7 w-7 rounded-full border border-sky-200 object-cover dark:border-slate-600"
                  />
                ) : (
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary-700 text-xs font-bold text-white">
                    {getNameInitial(admin?.name)}
                  </span>
                )}
                <span className="max-w-[92px] truncate">{admin?.name || 'Admin'}</span>
              </button>

              <span className="inline-flex rounded-full border border-primary-200 bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary-700 dark:border-primary-800 dark:bg-primary-900/30 dark:text-primary-200">
                {admin?.role?.replace('_', ' ') || 'user'}
              </span>

              <Button variant="secondary" className="gap-1.5 px-2.5 py-2 text-[11px] sm:px-3 sm:text-xs" onClick={onToggleDarkMode}>
                {isDarkMode ? <Sun className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
                {isDarkMode ? 'Light' : 'Dark'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <Modal title="Update Profile Picture" isOpen={isProfileModalOpen && canEditProfileImage} onClose={() => setIsProfileModalOpen(false)}>
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/70">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Preview</p>
            <div className="flex items-center gap-3">
              {previewImage ? (
                <img
                  src={previewImage}
                  alt="Profile preview"
                  className="h-16 w-16 rounded-full border-2 border-sky-200 object-cover dark:border-slate-700"
                />
              ) : (
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary-700 text-xl font-bold text-white">
                  {getNameInitial(admin?.name)}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{admin?.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Upload image file or paste image URL.</p>
              </div>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5 text-sm font-semibold text-sky-700 transition hover:bg-sky-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700">
              <Upload className="h-4 w-4" />
              {isProcessingFile ? 'Processing...' : 'Upload File'}
              <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} disabled={isProcessingFile} />
            </label>

            <Button
              variant="secondary"
              className="gap-2 px-3 py-2.5 text-sm"
              onClick={() => {
                setProfileDraft('');
                setProfileUrlInput('');
              }}
              disabled={!normalizedDraft && !currentProfileImage}
            >
              <XCircle className="h-4 w-4" />
              Remove Photo
            </Button>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Image URL (Optional)</span>
            <div className="relative">
              <Camera className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={profileUrlInput}
                onChange={(event) => {
                  setProfileUrlInput(event.target.value);
                  setProfileDraft(event.target.value);
                }}
                placeholder="https://your-image-url"
                className="w-full rounded-xl border border-slate-200/80 bg-white/90 py-2.5 pl-9 pr-3 text-sm text-slate-900 shadow-sm outline-none transition duration-200 placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-primary-900"
              />
            </div>
          </label>

          <Button
            className="w-full gap-2"
            onClick={handleSaveProfile}
            disabled={!hasChanges || isSavingProfile || isProcessingFile}
          >
            {isSavingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isSavingProfile ? 'Saving...' : 'Save Profile Picture'}
          </Button>
        </div>
      </Modal>
    </>
  );
}

export default AppHeader;
