import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Loading from '../components/Loading';
import { useAuth } from '../context/AuthContext';

const StatCard = ({ label, value }) => (
  <div className="rounded-xl border bg-white p-5 shadow-sm">
    <p className="text-sm text-gray-500">{label}</p>
    <p className="mt-1 text-2xl font-bold text-brand-700">{value}</p>
  </div>
);

const Home = () => {
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [stats, setStats] = useState(null);
  const [literature, setLiterature] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const projectRes = await api.get('/project');
        setProject(projectRes.data);
        if (user) {
          const [dashRes, litRes] = await Promise.all([
            api.get('/dashboard'),
            api.get('/literature'),
          ]);
          setStats(dashRes.data);
          setLiterature(litRes.data.slice(0, 3));
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (loading) return <Loading />;

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-gradient-to-br from-brand-700 to-brand-500 p-10 text-white shadow-lg">
        <h1 className="text-3xl font-bold">{project?.title || 'Untitled Project'}</h1>
        <p className="mt-3 max-w-2xl text-brand-50/90">{project?.description || 'Exploring the world of robotics through hands-on projects, intelligent automation, and innovative solutions. Our work focuses on designing and developing robots that combine hardware, software, sensors, and AI to solve real-world problems.'}</p>
        <div className="mt-5 flex items-center gap-3">
          <div className="h-2 w-48 overflow-hidden rounded-full bg-white/30">
            <div className="h-full bg-white" style={{ width: `${project?.progress || 0}%` }} />
          </div>
          <span className="text-sm">{project?.progress || 0}% complete</span>
        </div>
        {!user && (
          <div className="mt-6 flex gap-3">
            <Link to="/login" className="rounded-lg bg-white px-5 py-2 font-medium text-brand-700">Login</Link>
            <Link to="/register" className="rounded-lg border border-white/50 px-5 py-2 font-medium text-white">Register</Link>
          </div>
        )}
      </section>

      {user && stats && (
        <>
          <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label="Team Members" value={stats.totalMembers} />
            <StatCard label="Total Tasks" value={stats.totalTasks} />
            <StatCard label="Pending Tasks" value={stats.pendingTasks} />
            <StatCard label="Completed Tasks" value={stats.completedTasks} />
          </section>

          <section className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <h2 className="mb-3 font-semibold">Recent Messages</h2>
              {stats.recentMessages.length === 0 && <p className="text-sm text-gray-400">No messages yet.</p>}
              <ul className="space-y-2">
                {stats.recentMessages.map((m) => (
                  <li key={m._id} className="text-sm text-gray-600">
                    <span className="font-medium text-gray-800">{m.sender?.name}:</span> {m.message}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <h2 className="mb-3 font-semibold">Upcoming Deadlines</h2>
              {stats.upcomingDeadlines.length === 0 && <p className="text-sm text-gray-400">No upcoming deadlines.</p>}
              <ul className="space-y-2">
                {stats.upcomingDeadlines.map((t) => (
                  <li key={t._id} className="flex justify-between text-sm text-gray-600">
                    <span>{t.title}</span>
                    <span className="text-gray-400">{new Date(t.deadline).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="mb-3 font-semibold">Recent Literature</h2>
            {literature.length === 0 && <p className="text-sm text-gray-400">No literature added yet.</p>}
            <ul className="space-y-2">
              {literature.map((l) => (
                <li key={l._id} className="text-sm text-gray-600">
                  <span className="font-medium text-gray-800">{l.paperTitle}</span> — {l.authors} ({l.publicationYear})
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
};

export default Home;
