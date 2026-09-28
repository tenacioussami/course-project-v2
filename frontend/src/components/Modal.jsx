import { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({ open, title, onClose, children, wide = false }) => {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-ink-950/70 p-4 py-10 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className={`panel w-full animate-fade-up ${wide ? 'max-w-2xl' : 'max-w-lg'} shadow-2xl shadow-black/60`}>
        <div className="flex items-center justify-between border-b border-white/[0.07] px-6 py-4">
          <h3 className="font-display text-lg font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="icon-btn" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
