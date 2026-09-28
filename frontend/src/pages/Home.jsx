import { Link } from 'react-router-dom';
import {
  ArrowRight, Radio, ScanEye, Waves, Cog, Users, ListChecks, Wrench, FileText,
  MessageSquare, CalendarClock, BookOpen, Fingerprint, Compass, Route, ChevronRight,
  Luggage, Camera, User, Rocket, CalendarDays, LogIn, LayoutDashboard,
} from 'lucide-react';
import { useQuery } from '../lib/query';
import { preloadProps } from '../lib/routes';
import { useAuth } from '../context/AuthContext';
import { withDefaults, parseTimeline, paragraphs } from '../data/carrybot';
import HeroScene from '../components/HeroScene';
import { Skeleton } from '../components/Loading';

const features = [
  { icon: Radio, title: 'BLE + Coded IR Token', text: 'An ESP32-C3 token gives the user a unique BLE identity; coded IR tells left, center or right.', tone: 'from-lime-300/20 to-emerald-400/10 text-lime-300' },
  { icon: ScanEye, title: 'Vision', text: 'A camera detects people and common obstacles using lightweight on-device CV.', tone: 'from-cyan-400/20 to-sky-500/10 text-cyan-300' },
  { icon: Waves, title: 'Ultrasonic ×3', text: 'Front-left, front-center and front-right sensors measure obstacle distance.', tone: 'from-rose-400/20 to-orange-400/10 text-rose-300' },
  { icon: Cog, title: 'Differential Drive', text: 'Two geared DC motors with encoders move the basket smoothly and precisely.', tone: 'from-violet-400/20 to-fuchsia-500/10 text-violet-300' },
];

const steps = [
  { icon: Fingerprint, title: 'Identify', text: "Match the token's unique BLE identity — ignore everyone else nearby." },
  { icon: Compass, title: 'Localize', text: 'Read coded IR on multiple receivers to know if the user is left, center or right.' },
  { icon: Route, title: 'Navigate', text: 'Fuse vision + ultrasonic data to follow, slow, stop or steer around obstacles — then re-acquire the user.' },
];

const heroChips = [
  { icon: Camera, label: 'Vision-guided' },
  { icon: User, label: 'Human-following' },
  { icon: Luggage, label: 'Luggage assistant' },
  { icon: Radio, label: 'BLE + IR token' },
];

const Home = () => {
  const { user } = useAuth();
  const { data: raw } = useQuery('/project');
  const { data: stats } = useQuery('/dashboard');
  const { data: literature } = useQuery('/literature');
  const project = withDefaults(raw);
  const weeks = parseTimeline(project.timeline);
  const progress = Number(project.progress) || 0;
  const subtitle = (project.title || '').split(':').slice(1).join(':').trim();
  const intro = paragraphs(project.description)[0];
  const currentIdx = weeks.length ? Math.min(weeks.length, Math.max(1, Math.ceil((progress / 100) * weeks.length))) - 1 : -1;
  const current = weeks[currentIdx];
  const heroStats = [
    { icon: FileText, label: 'Total Members', value: stats?.totalMembers, to: '/members', tone: 'bg-violet-500/15 text-violet-300' },
    { icon: ListChecks, label: 'Ongoing Tasks', value: stats && (stats.inProgressTasks ?? 0) + (stats.pendingTasks ?? 0), to: '/tasks', tone: 'bg-sky-500/15 text-sky-400' },
    { icon: Wrench, label: 'Completed Tasks', value: stats?.completedTasks, to: '/tasks', tone: 'bg-flame-500/15 text-flame-400' },
    { icon: Users, label: 'Chat Messages', value: stats?.totalMessages ?? stats?.recentMessages?.length, to: '/messages', tone: 'bg-emerald-500/15 text-emerald-300' },
  ];

  return (
    <div className="space-y-24">
      {/* ── Hero (full-bleed) ── */}
      <section className="relative left-1/2 -mt-8 w-screen -translate-x-1/2 sm:-mt-10">
        {/* Scene image — desktop: bleeds in from the right */}
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-full lg:block">
          <div
            className="absolute right-0 top-2 aspect-[914/679] h-[600px] xl:h-[640px]"
            style={{
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, #000 26%), linear-gradient(to bottom, #000 78%, transparent 100%)',
              maskImage: 'linear-gradient(to right, transparent 0%, #000 26%), linear-gradient(to bottom, #000 78%, transparent 100%)',
              WebkitMaskComposite: 'source-in',
              maskComposite: 'intersect',
            }}
          >
            <HeroScene />
          </div>
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-ink-950" />
        </div>

        <div className="relative mx-auto grid max-w-7xl grid-cols-1 px-4 pb-10 pt-12 sm:px-6 lg:min-h-[660px] lg:grid-cols-[minmax(0,560px)_1fr] lg:items-center lg:pb-40 lg:pt-10">
          <div className="min-w-0 animate-fade-up">
            <nav className="mb-5 flex items-center gap-2 text-sm text-slate-400" aria-label="Breadcrumb">
              <span>Course Project</span>
              <ChevronRight size={14} />
              <span className="font-semibold text-slate-100">Robotics &amp; Embedded AI</span>
            </nav>
            <h1 className="flex items-center gap-4 font-display text-6xl font-bold leading-none tracking-tight text-white sm:text-7xl">
              <span>Carry<span className="text-sky-400">Bot</span></span>
              <Luggage className="h-12 w-12 text-sky-400 drop-shadow-[0_0_18px_rgba(56,189,248,.6)] sm:h-14 sm:w-14" strokeWidth={2.2} />
            </h1>
            <p className="mt-5 font-display text-2xl font-bold leading-snug text-white sm:text-[28px]">{subtitle || 'Vision-Guided Human-Following and Luggage Assistant Robot'}</p>
            <p className="mt-4 text-[15px] leading-7 text-slate-300 sm:text-base">{intro}</p>

            <div className="mt-6 flex flex-wrap gap-2.5">
              {heroChips.map((c) => (
                <span key={c.label} className="inline-flex items-center gap-2 rounded-xl border border-sky-400/25 bg-sky-500/[0.08] px-3.5 py-2 text-sm font-medium text-slate-100">
                  <c.icon size={16} className="text-sky-400" /> {c.label}
                </span>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-sky-400/25 bg-ink-900/70 p-5 backdrop-blur">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-2.5 font-semibold text-white"><Rocket size={18} className="text-violet-400" /> Project progress</p>
                <p className="font-display text-2xl font-bold text-sky-400">{progress}%</p>
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/[0.08]">
                <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-300 transition-[width] duration-700" style={{ width: `${progress}%` }} />
              </div>
              {current && (
                <p className="mt-3 flex min-w-0 items-center gap-2 text-sm text-slate-300">
                  <CalendarDays size={15} className="shrink-0 text-slate-400" /> <span className="whitespace-nowrap">Week {current.week} of {weeks.length}</span> <span className="text-slate-500">•</span> <span className="truncate">{current.title}</span>
                </p>
              )}
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link to="/project/overview" {...preloadProps('/project/overview')} className="btn-primary px-7 py-3.5 text-base">
                Explore the project <ArrowRight size={18} />
              </Link>
              {user ? (
                <Link to="/dashboard" {...preloadProps('/dashboard')} className="btn-secondary border-sky-400/40 px-6 py-3.5 text-base"><LayoutDashboard size={18} /> Dashboard</Link>
              ) : (
                <>
                  <Link to="/login" {...preloadProps('/login')} className="btn-secondary border-sky-400/40 px-6 py-3.5 text-base"><LogIn size={18} /> Login</Link>
                  <Link to="/register" {...preloadProps('/register')} className="btn px-3 text-base text-sky-400 hover:text-sky-300">Register <ArrowRight size={16} /></Link>
                </>
              )}
            </div>
          </div>

          {/* Scene image — mobile/tablet: its own card */}
          <div className="mt-10 overflow-hidden rounded-2xl border border-white/10 lg:hidden">
            <div className="relative aspect-[914/679]"><HeroScene /></div>
          </div>
        </div>

        {/* Glowing wave + stat bar */}
        <svg className="pointer-events-none absolute bottom-16 left-0 hidden h-24 w-full lg:block" viewBox="0 0 1440 100" preserveAspectRatio="none" aria-hidden>
          <defs>
            <linearGradient id="wave-g" x1="0" x2="1">
              <stop offset="0" stopColor="#8b5cf6" stopOpacity=".9" /><stop offset=".5" stopColor="#38bdf8" /><stop offset="1" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
          <path d="M0 40 C 240 90, 420 90, 720 60 S 1200 20, 1440 50 L1440 100 L0 100 Z" fill="#050b1c" opacity=".85" />
          <path d="M0 40 C 240 90, 420 90, 720 60 S 1200 20, 1440 50" fill="none" stroke="url(#wave-g)" strokeWidth="2.5" />
          <path d="M0 40 C 240 90, 420 90, 720 60 S 1200 20, 1440 50" fill="none" stroke="url(#wave-g)" strokeWidth="10" opacity=".25" />
        </svg>
        <div className="relative mx-auto grid max-w-7xl lg:-mt-24 grid-cols-2 gap-3 px-4 sm:px-6 lg:grid-cols-4 lg:gap-5">
          {heroStats.map((st) => (
            <Link key={st.label} to={st.to} {...preloadProps(st.to)} className="group flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-ink-900/85 p-4 backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-sky-400/30 sm:gap-5 sm:p-5">
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${st.tone}`}><st.icon size={26} /></span>
              <span>
                {st.value === undefined ? <Skeleton className="mb-1 h-7 w-10" /> : <span className="block font-display text-3xl font-bold leading-none text-white">{st.value}</span>}
                <span className="mt-1 block text-sm text-slate-300">{st.label}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section>
        <p className="eyebrow mb-3">Hardware &amp; sensing</p>
        <h2 className="mb-8 max-w-2xl text-3xl font-bold sm:text-4xl">Everything it needs to find you, follow you, and not bump into things.</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="card card-hover p-6">
              <div className={`mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ring-1 ring-white/10 ${f.tone}`}>
                <f.icon size={21} />
              </div>
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="card relative overflow-hidden p-8 sm:p-10">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-violet-600/20 blur-3xl" />
        <p className="eyebrow mb-3">How it works</p>
        <h2 className="mb-10 text-3xl font-bold">Identify → Localize → Navigate</h2>
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.title} className="relative">
              <div className="mb-4 flex items-center gap-3">
                <span className="font-mono text-sm text-cyan-300">0{i + 1}</span>
                <span className="h-px flex-1 bg-gradient-to-r from-cyan-400/40 to-transparent" />
              </div>
              <s.icon size={26} className="mb-3 text-white" />
              <h3 className="text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Live stats ── */}
      <section>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow mb-3">Live from the team</p>
            <h2 className="text-3xl font-bold">Project pulse</h2>
          </div>
          <Link to="/tasks" {...preloadProps('/tasks')} className="btn-ghost">All tasks <ArrowRight size={15} /></Link>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="card p-6">
            <h3 className="mb-4 flex items-center gap-2 text-base font-semibold"><MessageSquare size={16} className="text-cyan-300" /> Recent messages</h3>
            <ul className="space-y-3">
              {!stats && [0, 1, 2].map((i) => <Skeleton key={i} className="h-4 w-full" />)}
              {stats?.recentMessages?.length === 0 && <p className="text-sm text-slate-500">No messages yet.</p>}
              {stats?.recentMessages?.map((m) => (
                <li key={m._id} className="text-sm text-slate-400">
                  <span className="font-semibold text-slate-200">{m.sender?.name}</span> {m.message}
                </li>
              ))}
            </ul>
          </div>
          <div className="card p-6">
            <h3 className="mb-4 flex items-center gap-2 text-base font-semibold"><CalendarClock size={16} className="text-violet-300" /> Upcoming deadlines</h3>
            <ul className="space-y-3">
              {!stats && [0, 1, 2].map((i) => <Skeleton key={i} className="h-4 w-full" />)}
              {stats?.upcomingDeadlines?.length === 0 && <p className="text-sm text-slate-500">No upcoming deadlines.</p>}
              {stats?.upcomingDeadlines?.map((t) => (
                <li key={t._id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate text-slate-300">{t.title}</span>
                  <span className="shrink-0 font-mono text-xs text-slate-500">{new Date(t.deadline).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="card p-6">
            <h3 className="mb-4 flex items-center gap-2 text-base font-semibold"><BookOpen size={16} className="text-lime-300" /> Recent literature</h3>
            <ul className="space-y-3">
              {!literature && [0, 1, 2].map((i) => <Skeleton key={i} className="h-4 w-full" />)}
              {literature?.length === 0 && <p className="text-sm text-slate-500">No literature added yet.</p>}
              {literature?.slice(0, 4).map((l) => (
                <li key={l._id} className="text-sm">
                  <Link to="/project/literature" {...preloadProps('/project/literature')} className="line-clamp-1 font-medium text-slate-200 hover:text-cyan-300">{l.paperTitle}</Link>
                  <span className="font-mono text-xs text-slate-500">{[l.journal, l.publicationYear].filter(Boolean).join(' · ')}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Roadmap strip ── */}
      {weeks.length > 0 && (
        <section>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow mb-3">{weeks.length}-week roadmap</p>
              <h2 className="text-3xl font-bold">From token to demo day</h2>
            </div>
            <Link to="/project/overview" {...preloadProps('/project/overview')} className="btn-ghost">Full timeline <ArrowRight size={15} /></Link>
          </div>
          <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
            {weeks.map((w) => (
              <div key={w.week} className="card card-hover w-56 shrink-0 snap-start p-5">
                <p className="font-mono text-xs text-cyan-300">WEEK {String(w.week).padStart(2, '0')}</p>
                <p className="mt-2 text-sm font-semibold leading-snug text-slate-100">{w.title}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
