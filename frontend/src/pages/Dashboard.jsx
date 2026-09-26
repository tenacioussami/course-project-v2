import { useEffect, useState } from 'react';
import api from '../services/api';
import Loading from '../components/Loading';
import { useAuth } from '../context/AuthContext';

const Card = ({ label, value }) => (
  <div className="rounded-xl border bg-white p-5 shadow-sm">
    <p className="text-sm text-gray-500">{label}</p>
    <p className="mt-1 text-2xl font-bold text-brand-700">{value}</p>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/dashboard').then((res) => setStats(res.data));
  }, []);

  if (!stats) return <Loading />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Welcome{user ? `, ${user.name}` : ''} 👋</h1>
        <p className="text-gray-500">Here's what's happening with the project.</p>
      </div>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card label="Total Members" value={stats.totalMembers} />
        <Card label="Total Tasks" value={stats.totalTasks} />
        <Card label="Completed Tasks" value={stats.completedTasks} />
        <Card label="Pending Tasks" value={stats.pendingTasks} />
        <Card label="Project Progress" value={`${stats.projectProgress}%`} />
        <Card label="Total Literature" value={stats.totalLiterature} />
        <Card label="Total Equipment" value={stats.totalEquipment} />
        <Card label="Total Documents" value={stats.totalDocuments} />
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-semibold">Recent Messages</h2>
          <ul className="space-y-2">
            {stats.recentMessages.map((m) => (
              <li key={m._id} className="text-sm text-gray-600">
                <span className="font-medium text-gray-800">{m.sender?.name}:</span> {m.message}
              </li>
            ))}
            {stats.recentMessages.length === 0 && <p className="text-sm text-gray-400">No messages yet.</p>}
          </ul>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-semibold">Upcoming Deadlines</h2>
          <ul className="space-y-2">
            {stats.upcomingDeadlines.map((t) => (
              <li key={t._id} className="flex justify-between text-sm text-gray-600">
                <span>{t.title} {t.assignedTo ? `(${t.assignedTo.name})` : ''}</span>
                <span className="text-gray-400">{new Date(t.deadline).toLocaleDateString()}</span>
              </li>
            ))}
            {stats.upcomingDeadlines.length === 0 && <p className="text-sm text-gray-400">No upcoming deadlines.</p>}
          </ul>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;