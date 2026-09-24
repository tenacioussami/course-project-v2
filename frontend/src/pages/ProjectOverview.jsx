import { useEffect, useState } from 'react';
import { Pencil } from 'lucide-react';
import api from '../services/api';
import Loading from '../components/Loading';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';

const fields = [
  ['title', 'Project Title'],
  ['problemStatement', 'Problem Statement'],
  ['objectives', 'Objectives'],
  ['proposedSolution', 'Proposed Solution'],
  ['methodology', 'Methodology'],
  ['expectedOutcomes', 'Expected Outcomes'],
  ['technologiesUsed', 'Technologies Used'],
  ['timeline', 'Project Timeline'],
  ['description', 'Description'],
];

const ProjectOverview = () => {
  const { user } = useAuth();
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
        <h1 className="text-2xl font-bold">Project Overview</h1>
        {user && (
          <button onClick={() => setEditOpen(true)} className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
            <Pencil size={15} /> Edit Project
          </button>
        )}
      </div>

      <div className="space-y-5 rounded-xl border bg-white p-6 shadow-sm">
        <div>
          <p className="text-sm text-gray-500">Progress</p>
          <div className="mt-1 flex items-center gap-3">
            <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-gray-100">
              <div className="h-full bg-brand-500" style={{ width: `${project.progress}%` }} />
            </div>
            <span className="text-sm font-medium text-gray-600">{project.progress}%</span>
          </div>
        </div>
        {fields.map(([key, label]) => (
          <div key={key}>
            <p className="text-sm font-semibold text-gray-700">{label}</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">{project[key] || <span className="text-gray-300">Not set yet.</span>}</p>
          </div>
        ))}
      </div>

      <Modal open={editOpen} title="Edit Project Overview" onClose={() => setEditOpen(false)} wide>
        <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          {fields.map(([key, label]) => (
            <div key={key}>
              <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
              <textarea rows={key === 'title' ? 1 : 2} value={form[key] || ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="w-full rounded-lg border px-3 py-2" />
            </div>
          ))}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Progress (%)</label>
            <input type="number" min="0" max="100" value={form.progress || 0} onChange={(e) => setForm({ ...form, progress: e.target.value })} className="w-full rounded-lg border px-3 py-2" />
          </div>
          <button className="w-full rounded-lg bg-brand-600 py-2 font-medium text-white hover:bg-brand-700">Save Changes</button>
        </form>
      </Modal>
    </div>
  );
};

export default ProjectOverview;
