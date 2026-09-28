import { useState } from 'react';
import { Pencil, GraduationCap, Hash, User, Building2, Landmark, Mail } from 'lucide-react';
import api, { errMsg } from '../services/api';
import { useQuery, setQueryData } from '../lib/query';
import Modal from '../components/Modal';
import { toast } from '../components/Toast';
import { PageHeader, Field, Button } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { withDefaults, paragraphs } from '../data/carrybot';

const fields = [
  ['courseName', 'Course Name', GraduationCap],
  ['courseCode', 'Course Code', Hash],
  ['instructor', 'Instructor', User],
  ['department', 'Department', Building2],
  ['university', 'University', Landmark],
  ['contactInfo', 'Contact Information', Mail],
];

const About = () => {
  const { isAdmin } = useAuth();
  const { data: raw, refreshing } = useQuery('/project');
  const project = withDefaults(raw);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = Object.fromEntries(fields.map(([k]) => [k, form[k] || '']));
      const res = await api.put('/project', payload);
      setQueryData('/project', null, res.data);
      setEditOpen(false);
      toast('About info saved');
    } catch (err) {
      toast.error(errMsg(err, 'Could not save'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader eyebrow="About" title="About this project" refreshing={refreshing}>
        {isAdmin && (
          <button onClick={() => { setForm(project); setEditOpen(true); }} className="btn-primary">
            <Pencil size={15} /> Edit
          </button>
        )}
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="card space-y-4 p-7">
          <h2 className="text-xl font-bold">{project.title}</h2>
          {paragraphs(project.description).map((p, i) => <p key={i} className="text-slate-400">{p}</p>)}
          <div className="border-t border-white/[0.06] pt-5">
            <p className="eyebrow mb-2">Objective</p>
            <p className="text-slate-300">{project.objectives}</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {fields.map(([key, label, Icon]) => (
            <div key={key} className="card flex items-center gap-4 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-cyan-300">
                <Icon size={18} />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
                <p className="truncate font-medium text-slate-100">{project[key] || '—'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal open={editOpen} title="Edit About Information" onClose={() => setEditOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map(([key, label]) => (
            <Field key={key} label={label}>
              <input value={form[key] || ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="input" />
            </Field>
          ))}
          <Button loading={saving} className="btn-primary w-full py-3">Save changes</Button>
        </form>
      </Modal>
    </div>
  );
};

export default About;
