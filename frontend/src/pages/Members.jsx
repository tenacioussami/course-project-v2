import { useState } from 'react';
import { Plus, Pencil, Trash2, Github, Linkedin, BookOpen, Users, ArrowUpRight, ShieldCheck, GraduationCap, UserRound, ChevronDown } from 'lucide-react';
import api, { errMsg } from '../services/api';
import { useQuery, setQueryData, invalidate } from '../lib/query';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import FileUpload from '../components/FileUpload';
import { toast } from '../components/Toast';
import { PageHeader, EmptyState, Field, Button, Avatar, Badge, tones } from '../components/ui';
import { CardGridSkeleton } from '../components/Loading';
import { useAuth } from '../context/AuthContext';

const emptyForm = {
  name: '', email: '', password: '', role: 'member', studentId: '', department: '',
  skills: '', bio: '', github: '', linkedin: '', researchGate: '',
};

// Picks a sensible primary link for the "Follow" button
const primaryLink = (m) => m.linkedin || m.github || m.researchGate || null;
// Role look + meaning. Order here = order on the page (supervisors first).
const ROLES = {
  supervisor: { label: 'Supervisor', tone: 'amber', icon: GraduationCap, hint: 'Guides the project. Same access as a member, plus can see all survey results.' },
  admin: { label: 'Admin', tone: 'violet', icon: ShieldCheck, hint: 'Full control: can edit/delete anything and change roles.' },
  member: { label: 'Member', tone: 'cyan', icon: UserRound, hint: 'Can add items and edit only their own work.' },
};
const ROLE_KEYS = Object.keys(ROLES);
const roleOf = (m) => {
  const r = String(m?.role || 'member').toLowerCase();
  return ROLES[r] ? r : 'member';
};

const RoleBadge = ({ role }) => {
  const { label, tone, icon: Icon } = ROLES[role];
  return (
    <Badge tone={tone} className="gap-1">
      <Icon size={12} /> {label}
    </Badge>
  );
};

const Members = () => {
  const { isAdmin, user, setUser } = useAuth();
  const { data: members, loading, refreshing } = useQuery('/members');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [avatarFile, setAvatarFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [roleFilter, setRoleFilter] = useState('all');
  const [roleSaving, setRoleSaving] = useState(null);

  // Admin: change someone's role straight from their card
  const changeRole = async (m, newRole) => {
    if (newRole === roleOf(m)) return;
    if (user && m._id === user._id && newRole !== 'admin' &&
      !window.confirm(`You will lose admin access if you change your own role to ${ROLES[newRole].label}. Continue?`)) return;
    setRoleSaving(m._id);
    const prev = m.role;
    setQueryData('/members', null, (list = []) => list.map((x) => (x._id === m._id ? { ...x, role: newRole } : x)));
    try {
      const res = await api.put(`/members/${m._id}`, { role: newRole });
      setQueryData('/members', null, (list = []) => list.map((x) => (x._id === m._id ? { ...x, ...res.data } : x)));
      if (user && m._id === user._id) {
        const merged = { ...user, role: res.data.role };
        setUser(merged);
        localStorage.setItem('user', JSON.stringify(merged));
      }
      toast(`${m.name} is now ${ROLES[newRole].label}`);
    } catch (err) {
      setQueryData('/members', null, (list = []) => list.map((x) => (x._id === m._id ? { ...x, role: prev } : x)));
      toast.error(errMsg(err, 'Could not change role'));
    } finally {
      setRoleSaving(null);
    }
  };

  const all = Array.isArray(members) ? members : [];
  const counts = ROLE_KEYS.reduce((acc, r) => ({ ...acc, [r]: all.filter((m) => roleOf(m) === r).length }), {});
  const visible = all
    .filter((m) => roleFilter === 'all' || roleOf(m) === roleFilter)
    .sort((a, b) => ROLE_KEYS.indexOf(roleOf(a)) - ROLE_KEYS.indexOf(roleOf(b)));

  const openCreate = () => { setEditing(null); setForm(emptyForm); setAvatarFile(null); setModalOpen(true); };
  const openEdit = (m) => {
    setEditing(m);
    setForm({
      name: m.name, email: m.email, password: '', role: roleOf(m),
      studentId: m.studentId || '', department: m.department || '',
      skills: (m.skills || []).join(', '), bio: m.bio || '',
      github: m.github || '', linkedin: m.linkedin || '', researchGate: m.researchGate || '',
    });
    setAvatarFile(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        // Text fields first (JSON), then the profile image separately if changed.
        const res = await api.put(`/members/${editing._id}`, form);
        let updated = res.data;

        if (avatarFile) {
          const fd = new FormData();
          fd.append('profileImage', avatarFile);
          const imgRes = await api.put(`/members/${editing._id}`, fd);
          updated = imgRes.data;
        }

        setQueryData('/members', null, (list = []) => list.map((m) => (m._id === editing._id ? { ...m, ...updated } : m)));

        if (editing._id === user._id) {
          const merged = { ...user, ...updated };
          setUser(merged);
          localStorage.setItem('user', JSON.stringify(merged));
        }
      } else {
        await api.post('/members', form);
      }
      setModalOpen(false);
      toast(editing ? 'Profile updated' : 'Member added');
      invalidate('/members');
      invalidate('/dashboard');
    } catch (err) {
      toast.error(errMsg(err, 'Could not save member'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const id = deleteId;
    setDeleteId(null);
    setQueryData('/members', null, (list = []) => list.filter((m) => m._id !== id));
    try {
      await api.delete(`/members/${id}`);
      toast('Member removed');
    } catch (err) {
      toast.error(errMsg(err, 'Delete failed'));
    }
    invalidate('/members');
    invalidate('/dashboard');
  };

  return (
    <div>
      <PageHeader eyebrow="The crew" title="Team members" subtitle="The people building CarryBot." refreshing={refreshing && !loading}>
        {isAdmin && (
          <button onClick={openCreate} className="btn-primary"><Plus size={16} /> Add member</button>
        )}
      </PageHeader>

      {!loading && all.length > 0 && (
        <div className="mb-6 flex w-fit flex-wrap gap-1 rounded-xl border border-white/10 bg-white/[0.02] p-1">
          {[['all', 'All', all.length], ...ROLE_KEYS.map((r) => [r, `${ROLES[r].label}s`, counts[r]])].map(([key, label, n]) => (
            <button key={key} onClick={() => setRoleFilter(key)} className={`tab ${roleFilter === key ? 'tab-active' : ''}`}>
              {label} <span className="ml-1 font-mono text-xs text-slate-500">{n}</span>
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <CardGridSkeleton tall />
      ) : visible.length === 0 ? (
        <EmptyState icon={Users} title={roleFilter === 'all' ? 'No members yet' : `No ${ROLES[roleFilter].label.toLowerCase()}s yet`} />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((m) => {
            const link = primaryLink(m);
            const canEdit = isAdmin || (user && m._id === user._id);
            return (
              <div key={m._id} className="card card-hover group relative overflow-hidden p-6 text-center">
                <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-br from-cyan-500/15 via-transparent to-violet-600/20" />
                {canEdit && (
                  <div className="absolute right-3 top-3 z-10 flex gap-1 opacity-0 transition group-hover:opacity-100 max-md:opacity-100">
                    <button onClick={() => openEdit(m)} className="icon-btn bg-ink-900/60" aria-label="Edit"><Pencil size={15} /></button>
                    {isAdmin && user && m._id !== user._id && (
                      <button onClick={() => setDeleteId(m._id)} className="icon-btn-danger bg-ink-900/60" aria-label="Delete"><Trash2 size={15} /></button>
                    )}
                  </div>
                )}

                <div className="relative mx-auto mb-4 w-fit rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 p-[3px]">
                  <Avatar name={m.name} src={m.profileImage} size={104} className="ring-4 ring-ink-900" />
                </div>

                <h3 className="text-lg font-bold">{m.name}</h3>
                <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                  {isAdmin ? (
                    <label className="relative inline-flex items-center" title="Change role">
                      <span className="sr-only">Role for {m.name}</span>
                      <select
                        value={roleOf(m)}
                        disabled={roleSaving === m._id}
                        onChange={(e) => changeRole(m, e.target.value)}
                        className={`badge cursor-pointer appearance-none pr-6 outline-none transition hover:brightness-125 disabled:opacity-60 ${tones[ROLES[roleOf(m)].tone]}`}
                      >
                        {ROLE_KEYS.map((r) => <option key={r} value={r}>{ROLES[r].label}</option>)}
                      </select>
                      <ChevronDown size={12} className="pointer-events-none absolute right-2 opacity-70" />
                    </label>
                  ) : (
                    <RoleBadge role={roleOf(m)} />
                  )}
                  {m.studentId && <span className="font-mono text-xs text-slate-500">ID {m.studentId}</span>}
                </div>
                {m.department && <p className="mt-1.5 text-xs text-slate-500">{m.department}</p>}
                {m.bio && <p className="mt-3 line-clamp-3 text-sm text-slate-400">{m.bio}</p>}

                {m.skills?.length > 0 && (
                  <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                    {m.skills.filter(Boolean).map((s) => <span key={s} className="chip">{s}</span>)}
                  </div>
                )}

                <div className="mt-5 flex items-center justify-center gap-2">
                  {link && (
                    <a href={link} target="_blank" rel="noreferrer" className="btn-primary btn-sm px-4 py-2">
                      Follow <ArrowUpRight size={14} />
                    </a>
                  )}
                  {m.github && <a href={m.github} target="_blank" rel="noreferrer" className="icon-btn border border-white/10" aria-label="GitHub"><Github size={15} /></a>}
                  {m.linkedin && <a href={m.linkedin} target="_blank" rel="noreferrer" className="icon-btn border border-white/10" aria-label="LinkedIn"><Linkedin size={15} /></a>}
                  {m.researchGate && <a href={m.researchGate} target="_blank" rel="noreferrer" className="icon-btn border border-white/10" aria-label="ResearchGate"><BookOpen size={15} /></a>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} title={editing ? 'Edit member' : 'Add member'} onClose={() => setModalOpen(false)} wide>
        <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          <FileUpload label="Profile picture" accept="image/*" onFileSelect={setAvatarFile} existingUrl={editing?.profileImage} />

          <div className="grid grid-cols-2 gap-3">
            <Field label="Name">
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
            </Field>
            <Field label="Email">
              <input type="email" required disabled={!!editing} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" />
            </Field>
          </div>

          {!editing && (
            <Field label="Temporary password">
              <input type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input" />
            </Field>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Student ID">
              <input value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} className="input" />
            </Field>
            <Field label="Department">
              <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="input" />
            </Field>
          </div>

          {isAdmin && (
            <Field label="Role">
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="input">
                {ROLE_KEYS.map((r) => <option key={r} value={r}>{ROLES[r].label}</option>)}
              </select>
              <p className="mt-1.5 text-xs text-slate-500">{ROLES[form.role]?.hint}</p>
            </Field>
          )}

          <Field label="Skills (comma separated)">
            <input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} className="input" placeholder="Embedded C, OpenCV, PCB design" />
          </Field>

          <Field label="About / short bio">
            <textarea rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="input" />
          </Field>

          <div className="space-y-3 rounded-xl border border-white/10 p-4">
            <p className="text-sm font-semibold text-white">Social profiles</p>
            <Field label="GitHub URL">
              <input placeholder="https://github.com/username" value={form.github} onChange={(e) => setForm({ ...form, github: e.target.value })} className="input" />
            </Field>
            <Field label="LinkedIn URL">
              <input placeholder="https://linkedin.com/in/username" value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} className="input" />
            </Field>
            <Field label="ResearchGate URL">
              <input placeholder="https://researchgate.net/profile/username" value={form.researchGate} onChange={(e) => setForm({ ...form, researchGate: e.target.value })} className="input" />
            </Field>
          </div>

          <Button loading={saving} className="btn-primary w-full py-3">{editing ? 'Save changes' : 'Add member'}</Button>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} message="This member will be permanently removed." onCancel={() => setDeleteId(null)} onConfirm={handleDelete} />
    </div>
  );
};

export default Members;