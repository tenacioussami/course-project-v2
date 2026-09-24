import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Github, Linkedin, BookOpen } from 'lucide-react';
import api from '../services/api';
import Loading from '../components/Loading';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import FileUpload from '../components/FileUpload';
import { useAuth } from '../context/AuthContext';

const emptyForm = {
  name: '', email: '', password: '', role: 'member', studentId: '', department: '',
  skills: '', bio: '', github: '', linkedin: '', researchGate: '',
};

// Picks a sensible primary link for the "Follow On" button
const primaryLink = (m) => m.linkedin || m.github || m.researchGate || null;

const Members = () => {
  const { isAdmin, user, setUser } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [avatarFile, setAvatarFile] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const load = async () => {
    setLoading(true);
    const res = await api.get('/members');
    setMembers(res.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setAvatarFile(null); setModalOpen(true); };
  const openEdit = (m) => {
    setEditing(m);
    setForm({
      name: m.name, email: m.email, password: '', role: m.role,
      studentId: m.studentId || '', department: m.department || '',
      skills: (m.skills || []).join(', '), bio: m.bio || '',
      github: m.github || '', linkedin: m.linkedin || '', researchGate: m.researchGate || '',
    });
    setAvatarFile(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (editing) {
      // Text fields first (JSON), then the profile image separately if changed —
      // matches the pattern used elsewhere for file uploads.
      const res = await api.put(`/members/${editing._id}`, form);
      let updated = res.data;

      if (avatarFile) {
        const fd = new FormData();
        fd.append('profileImage', avatarFile);
        const imgRes = await api.put(`/members/${editing._id}`, fd);
        updated = imgRes.data;
      }

      if (editing._id === user._id) {
        const merged = { ...user, ...updated };
        setUser(merged);
        localStorage.setItem('user', JSON.stringify(merged));
      }
    } else {
      await api.post('/members', form);
    }
    setModalOpen(false);
    load();
  };

  const handleDelete = async () => {
    await api.delete(`/members/${deleteId}`);
    setDeleteId(null);
    load();
  };

  if (loading) return <Loading />;

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Team Members</h1>
        {isAdmin && (
          <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
            <Plus size={16} /> Add Member
          </button>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((m) => {
          const link = primaryLink(m);
          return (
            <div key={m._id} className="rounded-2xl bg-emerald-50/70 p-6 text-center shadow-sm">
              <div className="mx-auto mb-4 h-28 w-28 overflow-hidden rounded-full border-4 border-white shadow">
                {m.profileImage ? (
                  <img src={m.profileImage} alt={m.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-brand-100 text-3xl font-bold text-brand-700">
                    {m.name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <h3 className="text-lg font-semibold text-gray-800">
                {m.name}{m.studentId && <>, ID: {m.studentId}</>}
              </h3>
              <p className="mt-1 text-xs uppercase tracking-wide text-brand-600">{m.role}{m.department ? ` · ${m.department}` : ''}</p>
              {m.bio && <p className="mt-3 text-sm text-gray-500">{m.bio}</p>}

              {m.skills?.length > 0 && (
                <div className="mt-3 flex flex-wrap justify-center gap-1">
                  {m.skills.map((s) => <span key={s} className="rounded-full bg-white px-2 py-0.5 text-xs text-gray-600">{s}</span>)}
                </div>
              )}

              {link && (
                <a href={link} target="_blank" rel="noreferrer"
                  className="mt-4 inline-block rounded-lg bg-emerald-700 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-800">
                  Follow On
                </a>
              )}

              <div className="mt-4 flex justify-center gap-3">
                {m.github && (
                  <a href={m.github} target="_blank" rel="noreferrer" className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-800 text-white hover:bg-gray-700">
                    <Github size={16} />
                  </a>
                )}
                {m.linkedin && (
                  <a href={m.linkedin} target="_blank" rel="noreferrer" className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-800 text-white hover:bg-gray-700">
                    <Linkedin size={16} />
                  </a>
                )}
                {m.researchGate && (
                  <a href={m.researchGate} target="_blank" rel="noreferrer" className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-800 text-white hover:bg-gray-700">
                    <BookOpen size={16} />
                  </a>
                )}
              </div>

              {(isAdmin || (user && m._id === user._id)) && (
                <div className="mt-4 flex justify-center gap-3 border-t border-emerald-100 pt-3">
                  <button onClick={() => openEdit(m)} className="text-gray-400 hover:text-brand-600"><Pencil size={16} /></button>
                  {isAdmin && user && m._id !== user._id && (
                    <button onClick={() => setDeleteId(m._id)} className="text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Modal open={modalOpen} title={editing ? 'Edit Member' : 'Add Member'} onClose={() => setModalOpen(false)} wide>
        <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          <FileUpload label="Profile Picture" accept="image/*" onFileSelect={setAvatarFile} existingUrl={editing?.profileImage} />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border px-3 py-2" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
              <input type="email" required disabled={!!editing} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border px-3 py-2 disabled:bg-gray-100" />
            </div>
          </div>

          {!editing && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Temporary Password</label>
              <input type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full rounded-lg border px-3 py-2" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Student ID</label>
              <input value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} className="w-full rounded-lg border px-3 py-2" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Department</label>
              <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="w-full rounded-lg border px-3 py-2" />
            </div>
          </div>

          {isAdmin && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Role</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full rounded-lg border px-3 py-2">
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Skills (comma separated)</label>
            <input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} className="w-full rounded-lg border px-3 py-2" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">About / Short Bio</label>
            <textarea rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="w-full rounded-lg border px-3 py-2" />
          </div>

          <div className="rounded-lg border p-3">
            <p className="mb-2 text-sm font-semibold text-gray-700">Social Profiles</p>
            <div className="space-y-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">GitHub URL</label>
                <input placeholder="https://github.com/username" value={form.github} onChange={(e) => setForm({ ...form, github: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">LinkedIn URL</label>
                <input placeholder="https://linkedin.com/in/username" value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">ResearchGate URL</label>
                <input placeholder="https://researchgate.net/profile/username" value={form.researchGate} onChange={(e) => setForm({ ...form, researchGate: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" />
              </div>
            </div>
          </div>

          <button className="w-full rounded-lg bg-brand-600 py-2 font-medium text-white hover:bg-brand-700">{editing ? 'Save Changes' : 'Add Member'}</button>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} message="This member will be permanently removed." onCancel={() => setDeleteId(null)} onConfirm={handleDelete} />
    </div>
  );
};

export default Members;
