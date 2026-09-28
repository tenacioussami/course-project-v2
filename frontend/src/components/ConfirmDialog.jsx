import { AlertTriangle } from 'lucide-react';

const ConfirmDialog = ({ open, title = 'Are you sure?', message, onConfirm, onCancel }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/70 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onCancel?.()}>
      <div className="panel w-full max-w-sm animate-fade-up p-6 shadow-2xl">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/15 text-rose-300">
          <AlertTriangle size={20} />
        </div>
        <h3 className="font-display text-lg font-semibold text-white">{title}</h3>
        {message && <p className="mt-1.5 text-sm text-slate-400">{message}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onCancel} className="btn-ghost">Cancel</button>
          <button onClick={onConfirm} className="btn-danger">Delete</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
