import { useState } from 'react';
import { Plus, Pencil, Trash2, Search, ListChecks, CalendarDays, ArrowDownUp } from 'lucide-react';
import api, { errMsg } from '../services/api';
import { useQuery, useDebounced, setQueryData, invalidate } from '../lib/query';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { toast } from '../components/Toast';
import { PageHeader, EmptyState, Field, Button, Avatar, Badge } from '../components/ui';
import { ListSkeleton } from '../components/Loading';
import { useAuth } from '../context/AuthContext';

const emptyForm = {
  title: '', description: '', assignedTo: '', priority: 'Medium', status: 'Pending', startDate: '', deadline: '',
};

const STATUSES = ['Pending', 'In Progress', 'Completed'];
const statusTone = { Pending: 'slate', 'In Progress': 'cyan', Completed: 'green' };
const priorityTone = { Low: 'slate', Medium: 'amber', High: 'rose' };
const statusSelect = {
  Pending: 'bg-slate-400/10 text-slate-300 ring-slate-400/20',
  'In Progress': 'bg-cyan-400/10 text-cyan-300 ring-cyan-400/25',
  Completed: 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/25',
};

const Tasks = () => {
  const { user, isAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortByDeadline, setSortByDeadline] = useState(false);
  const q = useDebounced(search);
  const params = { search: q, status: statusFilter, sort: sortByDeadline ? 'deadline' : '' };

  const { data: tasks, loading, refreshing } = useQuery('/tasks', params);
  const { data: members = [] } = useQuery('/members');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const patchLocal = (fn) => setQueryData('/tasks', params, (list = []) => fn(list));

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (t) => {
    setEditing(t);
    setForm({
      title: t.title, description: t.description || '', assignedTo: t.assignedTo?._id || '',
      priority: t.priority, status: t.status,
      startDate: t.startDate ? t.startDate.slice(0, 10) : '',
      deadline: t.deadline ? t.deadline.slice(0, 10) : '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) await api.put(`/tasks/${editing._id}`, form);
      else await api.post('/tasks', form);
      setModalOpen(false);
      toast(editing ? 'Task updated' : 'Task created');
      invalidate('/tasks');
      invalidate('/dashboard');
    } catch (err) {
      toast.error(errMsg(err, 'Could not save task'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const id = deleteId;
    setDeleteId(null);
    patchLocal((list) => list.filter((t) => t._id !== id)); // disappear instantly
    try {
      await api.delete(`/tasks/${id}`);
      toast('Task deleted');
    } catch (err) {
      toast.error(errMsg(err, 'Delete failed'));
    }
    invalidate('/tasks');
    invalidate('/dashboard');
  };

  const quickStatusChange = async (task, status) => {
    patchLocal((list) => list.map((t) => (t._id === task._id ? { ...t, status } : t))); // instant
    try {
      await api.put(`/tasks/${task._id}`, { status });
    } catch (err) {
      toast.error(errMsg(err, 'Could not update status'));
      invalidate('/tasks');
    }
    invalidate('/dashboard');
  };

  // A member may only update a task they created or are assigned to; admins can update any.
  const canEdit = (task) => isAdmin || (user && (task.createdBy?._id === user._id || task.assignedTo?._id === user._id));

  const counts = STATUSES.reduce((acc, s) => ({ ...acc, [s]: (tasks || []).filter((t) => t.status === s).length }), {});

  return (
    <div>
      <PageHeader eyebrow="Workboard" title="Tasks" subtitle="Who's doing what, and by when." refreshing={refreshing && !loading}>
        {user && (
          <button onClick={openCreate} className="btn-primary"><Plus size={16} /> Add task</button>
        )}
      </PageHeader>

      {/* Filters */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="search-box w-full sm:w-72">
          <Search size={16} className="text-slate-500" />
          <input placeholder="Search tasks…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex rounded-xl border border-white/10 bg-white/[0.03] p-1">
          {['', ...STATUSES].map((s) => (
            <button key={s || 'all'} onClick={() => setStatusFilter(s)} className={`tab py-1.5 text-xs ${statusFilter === s ? 'tab-active' : ''}`}>
              {s || 'All'}{s && tasks && !statusFilter ? <span className="ml-1.5 text-slate-500">{counts[s]}</span> : null}
            </button>
          ))}
        </div>
        <button onClick={() => setSortByDeadline((v) => !v)} className={`btn-sm ${sortByDeadline ? 'btn-secondary border-cyan-400/40 text-cyan-200' : 'btn-ghost'}`}>
          <ArrowDownUp size={14} /> Sort by deadline
        </button>
      </div>

      {loading ? (
        <ListSkeleton />
      ) : tasks.length === 0 ? (
        <EmptyState icon={ListChecks} title="No tasks found" hint={search || statusFilter ? 'Try a different search or filter.' : 'Create the first task for the team.'} />
      ) : (
        <>
          {/* Desktop table */}
          <div className="card hidden overflow-hidden md:block">
            <table className="min-w-full">
              <thead className="table-head">
                <tr>
                  <th className="px-5 py-3.5">Task</th>
                  <th className="px-5 py-3.5">Assigned</th>
                  <th className="px-5 py-3.5">Priority</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Deadline</th>
                  <th className="px-5 py-3.5 text-right" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {tasks.map((t) => (
                  <tr key={t._id} className="group transition hover:bg-white/[0.02]">
                    <td className="max-w-sm px-5 py-4">
                      <p className="font-semibold text-slate-100">{t.title}</p>
                      {t.description && <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{t.description}</p>}
                    </td>
                    <td className="px-5 py-4">
                      {t.assignedTo ? (
                        <span className="flex items-center gap-2 text-sm text-slate-300"><Avatar name={t.assignedTo.name} size={26} /> {t.assignedTo.name}</span>
                      ) : <span className="text-sm text-slate-600">—</span>}
                    </td>
                    <td className="px-5 py-4"><Badge tone={priorityTone[t.priority]}>{t.priority}</Badge></td>
                    <td className="px-5 py-4">
                      {canEdit(t) ? (
                        <select value={t.status} onChange={(e) => quickStatusChange(t, e.target.value)}
                          className={`cursor-pointer rounded-full border-0 px-2.5 py-1 text-[11px] font-semibold outline-none ring-1 ring-inset ${statusSelect[t.status]}`}>
                          {STATUSES.map((s) => <option key={s}>{s}</option>)}
                        </select>
                      ) : (
                        <Badge tone={statusTone[t.status]}>{t.status}</Badge>
                      )}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-400">{t.deadline ? new Date(t.deadline).toLocaleDateString() : '—'}</td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1 opacity-60 transition group-hover:opacity-100">
                        {canEdit(t) && <button onClick={() => openEdit(t)} className="icon-btn" aria-label="Edit"><Pencil size={15} /></button>}
                        {isAdmin && <button onClick={() => setDeleteId(t._id)} className="icon-btn-danger" aria-label="Delete"><Trash2 size={15} /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {tasks.map((t) => (
              <div key={t._id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-100">{t.title}</p>
                    {t.description && <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{t.description}</p>}
                  </div>
                  <div className="flex shrink-0">
                    {canEdit(t) && <button onClick={() => openEdit(t)} className="icon-btn"><Pencil size={15} /></button>}
                    {isAdmin && <button onClick={() => setDeleteId(t._id)} className="icon-btn-danger"><Trash2 size={15} /></button>}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {canEdit(t) ? (
                    <select value={t.status} onChange={(e) => quickStatusChange(t, e.target.value)}
                      className={`rounded-full border-0 px-2.5 py-1 text-[11px] font-semibold outline-none ring-1 ring-inset ${statusSelect[t.status]}`}>
                      {STATUSES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  ) : <Badge tone={statusTone[t.status]}>{t.status}</Badge>}
                  <Badge tone={priorityTone[t.priority]}>{t.priority}</Badge>
                  {t.assignedTo && <span className="text-xs text-slate-400">· {t.assignedTo.name}</span>}
                  {t.deadline && <span className="ml-auto flex items-center gap-1 font-mono text-xs text-slate-500"><CalendarDays size={12} />{new Date(t.deadline).toLocaleDateString()}</span>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Modal open={modalOpen} title={editing ? 'Edit task' : 'Add task'} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Title">
            <input required autoFocus value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" />
          </Field>
          <Field label="Description">
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" rows={3} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Assigned member">
              <select value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} className="input">
                <option value="">Unassigned</option>
                {members.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
              </select>
            </Field>
            <Field label="Priority">
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="input">
                <option>Low</option><option>Medium</option><option>High</option>
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start date">
              <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="input" />
            </Field>
            <Field label="Deadline">
              <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="input" />
            </Field>
          </div>
          <Field label="Status">
            <div className="grid grid-cols-3 gap-2">
              {STATUSES.map((s) => (
                <button type="button" key={s} onClick={() => setForm({ ...form, status: s })}
                  className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${form.status === s ? 'border-cyan-400/50 bg-cyan-400/10 text-cyan-200' : 'border-white/10 text-slate-400 hover:border-white/20'}`}>
                  {s}
                </button>
              ))}
            </div>
          </Field>
          <Button loading={saving} className="btn-primary w-full py-3">{editing ? 'Save changes' : 'Create task'}</Button>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} message="This task will be permanently deleted." onCancel={() => setDeleteId(null)} onConfirm={handleDelete} />
    </div>
  );
};

export default Tasks;
