import { Link } from 'react-router-dom';
import { Users, ListChecks, CheckCircle2, Clock, Gauge, BookOpen, Cpu, FileText, MessageSquare, CalendarClock, Plus } from 'lucide-react';
import { useQuery } from '../lib/query';
import { preloadProps } from '../lib/routes';
import { useAuth } from '../context/AuthContext';
import { PageHeader, Avatar } from '../components/ui';
import { Skeleton } from '../components/Loading';

const Card = ({ icon: Icon, label, value, to, accent = 'text-cyan-300' }) => {
  const inner = (
    <>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
        <Icon size={16} className={accent} />
      </div>
      {value === undefined ? <Skeleton className="mt-3 h-8 w-16" /> : <p className="mt-2 font-display text-3xl font-bold text-white">{value}</p>}
    </>
  );
  return to ? (
    <Link to={to} {...preloadProps(to)} className="card card-hover block p-5">{inner}</Link>
  ) : (
    <div className="card p-5">{inner}</div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const { data: stats, refreshing } = useQuery('/dashboard');
  const s = stats || {};
  const total = s.totalTasks || 0;
  const pct = (n) => (total ? Math.round(((n || 0) / total) * 100) : 0);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Dashboard"
        title={<>Welcome{user ? <>, <span className="gradient-text">{(user.name || '').split(' ')[0]}</span></> : ''} 👋</>}
        subtitle="Here's what's happening with CarryBot right now."
        refreshing={refreshing}
      >
        <Link to="/tasks" {...preloadProps('/tasks')} className="btn-primary"><Plus size={16} /> New task</Link>
      </PageHeader>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card icon={Users} label="Members" value={stats && s.totalMembers} to="/members" />
        <Card icon={ListChecks} label="Total tasks" value={stats && s.totalTasks} to="/tasks" />
        <Card icon={CheckCircle2} label="Completed" value={stats && s.completedTasks} to="/tasks" accent="text-emerald-300" />
        <Card icon={Clock} label="Pending" value={stats && s.pendingTasks} to="/tasks" accent="text-amber-300" />
        <Card icon={Gauge} label="Progress" value={stats && `${s.projectProgress}%`} to="/project/overview" accent="text-violet-300" />
        <Card icon={BookOpen} label="Literature" value={stats && s.totalLiterature} to="/project/literature" accent="text-lime-300" />
        <Card icon={Cpu} label="Equipment" value={stats && s.totalEquipment} to="/project/equipments" />
        <Card icon={FileText} label="Documents" value={stats && s.totalDocuments} to="/project/paper-work" accent="text-violet-300" />
      </section>

      {/* Task breakdown bar */}
      <section className="card p-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold">Task breakdown</h2>
          <div className="flex gap-4 font-mono text-xs text-slate-400">
            <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-emerald-400" /> Done {s.completedTasks ?? 0}</span>
            <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-cyan-400" /> In progress {s.inProgressTasks ?? 0}</span>
            <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-slate-500" /> Pending {s.pendingTasks ?? 0}</span>
          </div>
        </div>
        <div className="flex h-3 overflow-hidden rounded-full bg-white/[0.05]">
          <div className="bg-emerald-400 transition-all duration-700" style={{ width: `${pct(s.completedTasks)}%` }} />
          <div className="bg-cyan-400 transition-all duration-700" style={{ width: `${pct(s.inProgressTasks)}%` }} />
          <div className="bg-slate-500 transition-all duration-700" style={{ width: `${pct(s.pendingTasks)}%` }} />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-semibold"><MessageSquare size={16} className="text-cyan-300" /> Recent messages</h2>
            <Link to="/messages" {...preloadProps('/messages')} className="text-xs font-semibold text-cyan-300 hover:underline">Open chat</Link>
          </div>
          <ul className="space-y-3">
            {!stats && [0, 1, 2].map((i) => <Skeleton key={i} className="h-9 w-full" />)}
            {s.recentMessages?.map((m) => (
              <li key={m._id} className="flex items-start gap-3">
                <Avatar name={m.sender?.name} size={30} />
                <p className="text-sm text-slate-400"><span className="font-semibold text-slate-200">{m.sender?.name}</span><br />{m.message}</p>
              </li>
            ))}
            {s.recentMessages?.length === 0 && <p className="text-sm text-slate-500">No messages yet.</p>}
          </ul>
        </div>
        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-semibold"><CalendarClock size={16} className="text-violet-300" /> Upcoming deadlines</h2>
            <Link to="/tasks" {...preloadProps('/tasks')} className="text-xs font-semibold text-cyan-300 hover:underline">All tasks</Link>
          </div>
          <ul className="divide-y divide-white/[0.05]">
            {!stats && [0, 1, 2].map((i) => <Skeleton key={i} className="my-2 h-7 w-full" />)}
            {s.upcomingDeadlines?.map((t) => (
              <li key={t._id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span className="min-w-0">
                  <span className="block truncate font-medium text-slate-200">{t.title}</span>
                  {t.assignedTo && <span className="text-xs text-slate-500">{t.assignedTo.name}</span>}
                </span>
                <span className="shrink-0 rounded-lg bg-white/[0.05] px-2 py-1 font-mono text-xs text-slate-300">{new Date(t.deadline).toLocaleDateString()}</span>
              </li>
            ))}
            {s.upcomingDeadlines?.length === 0 && <p className="text-sm text-slate-500">No upcoming deadlines.</p>}
          </ul>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
