import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

// Minimal global toast — call toast('Saved') or toast.error('Failed') from anywhere.
let push = () => {};
export const toast = (msg) => push({ msg, type: 'ok' });
toast.error = (msg) => push({ msg, type: 'err' });

export const Toaster = () => {
  const [items, setItems] = useState([]);
  useEffect(() => {
    push = (t) => {
      const id = Math.random().toString(36).slice(2);
      setItems((s) => [...s, { ...t, id }]);
      setTimeout(() => setItems((s) => s.filter((x) => x.id !== id)), 2600);
    };
    return () => { push = () => {}; };
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-5 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          className="panel pointer-events-auto flex animate-fade-up items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-100 shadow-2xl"
        >
          {t.type === 'ok' ? <CheckCircle2 size={16} className="text-emerald-300" /> : <XCircle size={16} className="text-rose-300" />}
          {t.msg}
        </div>
      ))}
    </div>
  );
};
