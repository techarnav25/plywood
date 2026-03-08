import Button from './Button.jsx';

function Modal({ title, isOpen, onClose, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="card-surface max-h-[90vh] w-full max-w-xl overflow-y-auto p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between border-b border-slate-200/70 pb-3 dark:border-slate-700/80">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
          <Button variant="ghost" className="px-3 py-1.5 text-xs" onClick={onClose}>
            Close
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default Modal;
