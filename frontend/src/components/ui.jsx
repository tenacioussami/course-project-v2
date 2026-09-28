import { Loader2 } from 'lucide-react';

export const PageHeader = ({ eyebrow, title, subtitle, children, refreshing }) => (
  <div className="mb-7 flex flex-wrap items-end justify-between gap-4 animate-fade-up">
    <div>
      {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
      <h1 className="page-title flex items-center gap-3">
        {title}
        {refreshing && <Loader2 size={18} className="animate-spin text-cyan-300/70" aria-label="Refreshing" />}
      </h1>
      {subtitle && <p className="mt-2 max-w-2xl text-slate-400">{subtitle}</p>}
    </div>
    {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
  </div>
);

export const EmptyState = ({ icon: Icon, title, hint, action }) => (
  <div className="card col-span-full flex flex-col items-center justify-center px-6 py-14 text-center">
    {Icon && (
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400/20 to-violet-500/20 text-cyan-300 ring-1 ring-white/10">
        <Icon size={22} />
      </div>
    )}
    <p className="font-display text-lg font-semibold text-white">{title}</p>
    {hint && <p className="mt-1 max-w-sm text-sm text-slate-400">{hint}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export const Field = ({ label, children, className = '' }) => (
  <div className={className}>
    {label && <label className="label">{label}</label>}
    {children}
  </div>
);

export const Button = ({ loading, children, className = 'btn-primary', ...props }) => (
  <button className={className} disabled={loading || props.disabled} {...props}>
    {loading && <Loader2 size={16} className="animate-spin" />}
    {children}
  </button>
);

export const Avatar = ({ name, src, size = 40, className = '' }) => {
  const initials = (name || '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return src ? (
    <img src={src} alt={name} loading="lazy" style={{ width: size, height: size }} className={`rounded-full object-cover ring-2 ring-white/10 ${className}`} />
  ) : (
    <div
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 font-display font-bold text-ink-950 ${className}`}
    >
      {initials}
    </div>
  );
};

// Tone → classes for status pills
export const tones = {
  slate: 'bg-slate-400/10 text-slate-300 ring-slate-400/20',
  cyan: 'bg-cyan-400/10 text-cyan-300 ring-cyan-400/25',
  violet: 'bg-violet-400/10 text-violet-300 ring-violet-400/25',
  green: 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/25',
  amber: 'bg-amber-400/10 text-amber-300 ring-amber-400/25',
  orange: 'bg-orange-400/10 text-orange-300 ring-orange-400/25',
  rose: 'bg-rose-400/10 text-rose-300 ring-rose-400/25',
};

export const Badge = ({ tone = 'slate', children, className = '' }) => (
  <span className={`badge ${tones[tone]} ${className}`}>{children}</span>
);
