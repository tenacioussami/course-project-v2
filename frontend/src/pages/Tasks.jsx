import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import api from '../services/api';
import Loading from '../components/Loading';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { useAuth } from '../context/AuthContext';

const emptyForm = {
  title: '', description: '', assignedTo: '', priority: 'Medium', status: 'Pending', startDate: '', deadline: '',
};

const statusColors = {
  Pending: 'bg-gray-100 text-gray-700',
  'In Progress': 'bg-blue-100 text-blue-700',
  Completed: 'bg-green-100 text-green-700',
};
const priorityColors = {
  Low: 'bg-gray-100 text-gray-600',
  Medium: 'bg-amber-100 text-amber-700',
  High: 'bg-red-100 text-red-700',
};

const Tasks = () => {
  const { user, isAdmin } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortByDeadline, setSortByDeadline] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const load = async () => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    if (sortByDeadline) params.sort = 'deadline';
    const [tasksRes, membersRes] = await Promise.all([
      api.get('/tasks', { params }),
      api.get('/members'),
    ]);
    setTasks(tasksRes.data);
    setMembers(membersRes.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [search, statusFilter, sortByDeadline]);

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
    if (editing) {
      await api.put(`/tasks/${editing._id}`, form);
    } else {
      await api.post('/tasks', form);
    }
    setModalOpen(false);
    load();
  };

  const handleDelete = async () => {
    await api.delete(`/tasks/${deleteId}`);
    setDeleteId(null);
    load();
  };

  const quickStatusChange = async (task, status) => {
    await api.put(`/tasks/${task._id}`, { status });
    load();
  };

  // A member may only update a task they created or are assigned to; admins can update any.
  const canEdit = (task) => isAdmin || (user && (task.createdBy?._id === user._id || task.assignedTo?._id === user._id));

  if (loading) return <Loading />;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Tasks</h1>
        {user && (
          <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
            <Plus size={16} /> Add Task
          </button>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2">
          <Search size={16} className="text-gray-400" />
          <input placeholder="Search tasks..." value={search} onChange={(e) => setSearch(e.target.value)} className="text-sm outline-none" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
          <option value="">All statuses</option>
          <option>Pending</option>
          <option>In Progress</option>
          <option>Completed</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" checked={sortByDeadline} onChange={(e) => setSortByDeadline(e.target.checked)} />
          Sort by deadline
        </label>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="min-w-full divide-y">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Assigned</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Deadline</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {tasks.map((t) => (
              <tr key={t._id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-800">{t.title}</p>
                  <p className="text-xs text-gray-400">{t.description}</p>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{t.assignedTo?.name || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${priorityColors[t.priority]}`}>{t.priority}</span>
                </td>
                <td className="px-4 py-3">
                  {canEdit(t) ? (
                    <select value={t.status} onChange={(e) => quickStatusChange(t, e.target.value)}
                      className={`rounded-full border-none px-2 py-1 text-xs font-medium ${statusColors[t.status]}`}>
                      <option>Pending</option>
                      <option>In Progress</option>
                      <option>Completed</option>
                    </select>
                  ) : (
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusColors[t.status]}`}>{t.status}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{t.deadline ? new Date(t.deadline).toLocaleDateString() : '—'}</td>
                <td className="px-4 py-3 text-right">
                  {canEdit(t) && <button onClick={() => openEdit(t)} className="mr-2 text-gray-400 hover:text-brand-600"><Pencil size={16} /></button>}
                  {isAdmin && <button onClick={() => setDeleteId(t._id)} className="text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>}
                </td>
              </tr>
            ))}
            {tasks.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">No tasks found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} title={editing ? 'Edit Task' : 'Add Task'} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Title</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-lg border px-3 py-2" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-lg border px-3 py-2" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Assigned Member</label>
              <select value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} className="w-full rounded-lg border px-3 py-2">
                <option value="">Unassigned</option>
                {members.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Priority</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full rounded-lg border px-3 py-2">
                <option>Low</option><option>Medium</option><option>High</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Start Date</label>
              <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full rounded-lg border px-3 py-2" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Deadline</label>
              <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="w-full rounded-lg border px-3 py-2" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-lg border px-3 py-2">
              <option>Pending</option><option>In Progress</option><option>Completed</option>
            </select>
          </div>
          <button className="w-full rounded-lg bg-brand-600 py-2 font-medium text-white hover:bg-brand-700">{editing ? 'Save Changes' : 'Create Task'}</button>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} message="This task will be permanently deleted." onCancel={() => setDeleteId(null)} onConfirm={handleDelete} />
    </div>
  );
};

export default Tasks;
