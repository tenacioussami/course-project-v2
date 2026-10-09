import { useEffect, useState } from 'react';
import {
  Pencil, AlertTriangle, Target, Lightbulb, Workflow, Trophy, Cpu, CalendarRange, FileText, Check,
} from 'lucide-react';
import api, { errMsg } from '../services/api';
import { useQuery, setQueryData, invalidate } from '../lib/query';
import Modal from '../components/Modal';
import { toast } from '../components/Toast';
import { Field, Button } from '../components/ui';
import Reveal from '../components/Reveal';
import { useAuth } from '../context/AuthContext';
import { withDefaults, parseTimeline, parseTech, paragraphs, TECH_STACK, DEFAULT_PROJECT } from '../data/carrybot';

const sections = [
  { id: 'problem', key: 'problemStatement', label: 'Problem Statement', icon: AlertTriangle },
  { id: 'objectives', key: 'objectives', label: 'Objectives', icon: Target },
  { id: 'solution', key: 'proposedSolution', label: 'Proposed Solution', icon: Lightbulb },
  { id: 'method', key: 'methodology', label: 'Methodology', icon: Workflow },
  { id: 'outcomes', key: 'expectedOutcomes', label: 'Expected Outcomes', icon: Trophy },
  { id: 'tech', key: 'technologiesUsed', label: 'Technologies Used', icon: Cpu },
  { id: 'timeline', key: 'timeline', label: 'Project Timeline', icon: CalendarRange },
  { id: 'description', key: 'description', label: 'Description', icon: FileText },
];

const editFields = [
  ['title', 'Project Title', 1],
  ['problemStatement', 'Problem Statement', 4],
  ['objectives', 'Objectives', 4],
  ['proposedSolution', 'Proposed Solution', 6],
  ['methodology', 'Methodology', 6],
  ['expectedOutcomes', 'Expected Outcomes', 4],
  ['technologiesUsed', 'Technologies Used  (tip: "Option 1 – Name: parts…" lines become config cards)', 6],
  ['timeline', 'Project Timeline  (one line per week: "Week 3: Title. Details")', 10],
  ['description', 'Description', 5],
];

const Paras = ({ text, lead = false }) => (
  <div className="space-y-4">
    {paragraphs(text).map((p, i) => (
      <p key={i} className={lead && i === 0 ? 'text-lg leading-8 text-slate-200' : 'text-slate-400'}>{p}</p>
    ))}
  </div>
);

const Section = ({ s, index, children }) => (
  <Reveal as="section" id={s.id} className="scroll-mt-24">
    <div className="mb-5 flex items-center gap-3">
      <span className="section-icon flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/15 to-violet-500/15 text-cyan-300 ring-1 ring-white/10">
        <s.icon size={19} />
      </span>
      <div>
        <p className="font-mono text-[11px] text-slate-500">{String(index + 1).padStart(2, '0')}</p>
        <h2 className="section-title text-2xl font-bold">{s.label}</h2>
      </div>
    </div>
    {children}
  </Reveal>
);

const ProgressRing = ({ value }) => {
  const r = 34;
  const c = 2 * Math.PI * r;
  // Count up from 0 to the real value when the page opens
  const [shown, setShown] = useState(0);
  useEffect(() => {
    let raf;
    const start = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - start) / 1400);
      setShown(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return (
    <div className="relative h-24 w-24">
      <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
        <defs>
          <linearGradient id="pr-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#22d3ee" /><stop offset="1" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="7" />
        <circle cx="40" cy="40" r={r} fill="none" stroke="url(#pr-g)" strokeWidth="7" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (c * shown) / 100} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-xl font-bold text-white">{shown}%</span>
        <span className="font-mono text-[9px] text-slate-500">DONE</span>
      </div>
    </div>
  );
};

const ProjectOverview = () => {
  const { user } = useAuth();
  const { data: raw, refreshing } = useQuery('/project');
  const project = withDefaults(raw);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [active, setActive] = useState(sections[0].id);

  const progress = Number(project.progress) || 0;
  const weeks = parseTimeline(project.timeline);
  const tech = parseTech(project.technologiesUsed);
  const currentWeek = weeks.length ? Math.min(weeks.length, Math.max(1, Math.ceil((progress / 100) * weeks.length))) : 0;
  const techIsDefault = project.technologiesUsed === DEFAULT_PROJECT.technologiesUsed;

  // Highlight the section that's on screen in the side nav
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setActive(vis[0].target.id);
      },
      { rootMargin: '-90px 0px -60% 0px' },
    );
    sections.forEach((s) => { const el = document.getElementById(s.id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);

  const jump = (id) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const openEdit = () => { setForm(project); setEditOpen(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const prev = raw;
    setQueryData('/project', null, { ...(raw || {}), ...form }); // show changes instantly
    try {
      const { _fromDefaults, ...payload } = form;
      const res = await api.put('/project', payload);
      setQueryData('/project', null, res.data);
      invalidate('/dashboard');
      setEditOpen(false);
      toast('Project overview saved');
    } catch (err) {
      setQueryData('/project', null, prev);
      toast.error(errMsg(err, 'Could not save'));
    } finally {
      setSaving(false);
    }
  };

  const [name, ...rest] = (project.title || '').split(':');
  const subtitle = rest.join(':').trim();

  return (
    <div>
      {/* Header */}
      <div className="relative mb-10 overflow-hidden rounded-3xl border border-white/[0.07] bg-gradient-to-br from-ink-800 via-ink-900 to-ink-950 p-7 sm:p-10">
        <div className="grid-bg pointer-events-none absolute inset-0" />
        <div className="orb absolute -right-20 -top-24 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="orb-2 absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-8">
          <div className="max-w-3xl animate-fade-up">
            <p className="eyebrow mb-3">Project Overview {refreshing && <span className="text-slate-500">· syncing…</span>}</p>
            <h1 className="font-display text-4xl font-bold leading-tight text-white sm:text-5xl">
              {subtitle ? <span className="gradient-text title-shimmer">{name}</span> : project.title}
            </h1>
            {subtitle && <p className="mt-3 font-display text-xl text-slate-200 sm:text-2xl">{subtitle}</p>}
            <div className="mt-6 flex flex-wrap gap-2">
              {['ESP32-S3', 'ESP32-C3 token', 'BLE + Coded IR', 'Camera CV', '3× Ultrasonic', 'Differential drive'].map((t) => (
                <span key={t} className="chip">{t}</span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-5">
            <ProgressRing value={progress} />
            {user && (
              <button onClick={openEdit} className="btn-primary">
                <Pencil size={15} /> Edit
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile section chips */}
      <div className="sticky top-16 z-20 -mx-4 mb-8 overflow-x-auto border-b border-white/[0.06] bg-ink-950/85 px-4 py-2.5 backdrop-blur-xl lg:hidden">
        <div className="flex gap-1.5">
          {sections.map((s) => (
            <button key={s.id} onClick={() => jump(s.id)} className={`tab shrink-0 whitespace-nowrap text-xs ${active === s.id ? 'tab-active' : ''}`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
        {/* Main content */}
        <div className="space-y-16">
          <Section s={sections[0]} index={0}>
            <div className="card border-l-2 border-l-rose-400/60 p-6 sm:p-7"><Paras text={project.problemStatement} lead /></div>
          </Section>

          <Section s={sections[1]} index={1}>
            <div className="card p-6 sm:p-7"><Paras text={project.objectives} lead /></div>
          </Section>

          <Section s={sections[2]} index={2}>
            <div className="reveal-stagger grid gap-4">
              {paragraphs(project.proposedSolution).map((p, i) => (
                <div key={i} className="card card-hover shine flex gap-4 p-5 sm:p-6">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.06] font-mono text-xs text-cyan-300">{i + 1}</span>
                  <p className="text-slate-300">{p}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section s={sections[3]} index={3}>
            <ol className="reveal-stagger relative space-y-4 border-l border-dashed border-white/10 pl-8">
              {paragraphs(project.methodology).map((p, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[45px] top-4 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 font-mono text-xs font-bold text-ink-950 shadow-glow">
                    {i + 1}
                  </span>
                  <div className="card p-5 sm:p-6"><p className="text-slate-300">{p}</p></div>
                </li>
              ))}
            </ol>
          </Section>

          <Section s={sections[4]} index={4}>
            <div className="reveal-stagger grid gap-4 sm:grid-cols-2">
              {paragraphs(project.expectedOutcomes).map((p, i) => (
                <div key={i} className="card card-hover shine p-6">
                  <Check size={18} className="mb-3 text-lime-300" />
                  <p className="text-slate-300">{p}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section s={sections[5]} index={5}>
            <div className="space-y-5">
              <div className="card space-y-4 p-6">
                {tech.paras.map((p, i) => <p key={i} className="text-slate-300">{p}</p>)}
                {techIsDefault && (
                  <div className="reveal-stagger flex flex-wrap gap-2 pt-1">
                    {TECH_STACK.map((t) => <span key={t} className="chip border-cyan-400/20 text-cyan-100">{t}</span>)}
                  </div>
                )}
              </div>
              {tech.options.length > 0 && (
                <>
                  <p className="eyebrow">{tech.options.length} processing configurations under test</p>
                  <div className="reveal-stagger grid gap-4 md:grid-cols-2">
                    {tech.options.map((o) => {
                      const parts = o.body.includes('+') && o.body.split('+').length > 2 ? o.body.replace(/\.$/, '').split('+').map((x) => x.trim()) : null;
                      return (
                        <div key={o.n} className="card card-hover shine relative overflow-hidden p-6">
                          <span className="absolute right-4 top-3 font-display text-6xl font-bold text-white/[0.04]">{o.n}</span>
                          <p className="font-mono text-xs text-violet-300">OPTION {o.n}</p>
                          <h3 className="mt-1 text-lg font-semibold">{o.name}</h3>
                          {parts ? (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {parts.map((x) => <span key={x} className="chip">{x}</span>)}
                            </div>
                          ) : (
                            <p className="mt-3 text-sm text-slate-400">{o.body}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </Section>

          <Section s={sections[6]} index={6}>
            {weeks.length ? (
              <ol className="reveal-stagger relative">
                <span className="timeline-line absolute bottom-3 left-[19px] top-3 w-px bg-gradient-to-b from-cyan-400/60 via-violet-500/40 to-transparent" />
                {weeks.map((w) => {
                  const state = w.week < currentWeek ? 'done' : w.week === currentWeek ? 'now' : 'next';
                  return (
                    <li key={w.week} className="relative flex gap-5 pb-5 last:pb-0">
                      <span
                        className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold ring-4 ring-ink-950 ${
                          state === 'done'
                            ? 'bg-gradient-to-br from-cyan-400 to-violet-500 text-ink-950'
                            : state === 'now'
                              ? 'now-pulse bg-ink-800 text-lime-300 ring-lime-300/30'
                              : 'bg-ink-800 text-slate-400'
                        }`}
                      >
                        {state === 'done' ? <Check size={16} /> : String(w.week).padStart(2, '0')}
                      </span>
                      <div className={`card flex-1 p-5 ${state === 'now' ? 'border-lime-300/30 shadow-[0_0_40px_-12px_rgba(163,255,92,.35)]' : ''}`}>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-mono text-xs text-cyan-300">WEEK {w.week}</p>
                          {state === 'now' && <span className="badge bg-lime-300/10 text-lime-300 ring-lime-300/25">In focus</span>}
                        </div>
                        <h3 className="mt-1 text-base font-semibold sm:text-lg">{w.title}</h3>
                        {w.detail && <p className="mt-1.5 text-sm text-slate-400">{w.detail}</p>}
                      </div>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <div className="card p-6"><Paras text={project.timeline} /></div>
            )}
          </Section>

          <Section s={sections[7]} index={7}>
            <div className="card p-6 sm:p-7"><Paras text={project.description} lead /></div>
          </Section>
        </div>

        {/* Right rail: at a glance + section nav */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <div className="card p-5">
              <p className="eyebrow mb-4">At a glance</p>
              <dl className="space-y-3 text-sm">
                {[
                  ['User ID', 'BLE token (ESP32-C3)'],
                  ['Direction', 'Coded IR · L / C / R'],
                  ['Obstacles', 'Camera + 3× ultrasonic'],
                  ['Drive', '2× geared DC + encoders'],
                  ['Brain', 'ESP32-S3 (± Pi Zero 2 W)'],
                  ['Timeline', `${weeks.length || '—'} weeks`],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3">
                    <dt className="text-slate-500">{k}</dt>
                    <dd className="text-right font-medium text-slate-200">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <nav className="card p-2">
              {sections.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => jump(s.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
                    active === s.id ? 'bg-white/[0.07] text-white' : 'text-slate-400 hover:bg-white/[0.04] hover:text-white'
                  }`}
                >
                  <span className={`font-mono text-[10px] ${active === s.id ? 'text-cyan-300' : 'text-slate-600'}`}>{String(i + 1).padStart(2, '0')}</span>
                  {s.label}
                </button>
              ))}
            </nav>
          </div>
        </aside>
      </div>

      <Modal open={editOpen} title="Edit Project Overview" onClose={() => setEditOpen(false)} wide>
        <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          <p className="rounded-xl bg-cyan-400/[0.06] px-3.5 py-2.5 text-xs text-cyan-100 ring-1 ring-cyan-400/15">
            Each new line becomes its own paragraph / card on the page.
          </p>
          {editFields.map(([key, label, rows]) => (
            <Field key={key} label={label}>
              <textarea rows={rows} value={form[key] || ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="input leading-6" />
            </Field>
          ))}
          <Field label={`Progress — ${form.progress || 0}%`}>
            <input type="range" min="0" max="100" value={form.progress || 0} onChange={(e) => setForm({ ...form, progress: Number(e.target.value) })} className="w-full accent-cyan-400" />
          </Field>
          <Button loading={saving} className="btn-primary w-full py-3">Save changes</Button>
        </form>
      </Modal>
    </div>
  );
};

export default ProjectOverview;