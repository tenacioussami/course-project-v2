import { useEffect, useState } from 'react';
import { Pencil } from 'lucide-react';
import api from '../services/api';
import Loading from '../components/Loading';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';

const fields = [
  ['courseName', 'Course Name'],
  ['courseCode', 'Course Code'],
  ['instructor', 'Instructor'],
  ['department', 'Department'],
  ['university', 'University'],
  ['contactInfo', 'Contact Information'],
];

const About = () => {
  const { user, isAdmin } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({});

  const load = async () => {
    const res = await api.get('/project');
    setProject(res.data);
    setForm(res.data);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.put('/project', form);
    setEditOpen(false);
    load();
  };

  if (loading) return <Loading />;

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold">About This Project</h1>
        {isAdmin && (
          <button onClick={() => setEditOpen(true)} className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
            <Pencil size={15} /> Edit
          </button>
        )}
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-600">{project.description || 'No description added yet.'}</p>
        <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {fields.map(([key, label]) => (
            <div key={key}>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</dt>
              <dd className="mt-0.5 text-sm text-gray-700">{project[key] || '—'}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-6 border-t pt-4">
          <h2 className="mb-2 text-sm font-semibold text-gray-700">Project Objectives</h2>
          <p className="whitespace-pre-wrap text-sm text-gray-600">{project.objectives || 'Not set yet.'}</p>
        </div>
      </div>

      <Modal open={editOpen} title="Edit About Information" onClose={() => setEditOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map(([key, label]) => (
            <div key={key}>
              <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
              <input value={form[key] || ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="w-full rounded-lg border px-3 py-2" />
            </div>
          ))}
          <button className="w-full rounded-lg bg-brand-600 py-2 font-medium text-white hover:bg-brand-700">Save Changes</button>
        </form>
      </Modal>
    </div>
  );
};

export default About;
