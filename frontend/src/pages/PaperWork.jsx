import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, FileText } from 'lucide-react';
import api from '../services/api';
import Loading from '../components/Loading';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import FileUpload from '../components/FileUpload';
import { useAuth } from '../context/AuthContext';

const emptyForm = { title: '', authors: '', abstract: '', keywords: '', introduction: '', methodology: '', results: '', discussion: '', conclusion: '', references: '', status: 'Draft' };

const statusColors = {
  Draft: 'bg-gray-100 text-gray-600',
  'Under Review': 'bg-amber-100 text-amber-700',
  Revision: 'bg-orange-100 text-orange-700',
  Completed: 'bg-green-100 text-green-700',
};

const PaperWork = () => {
  const { isAdmin, user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  const load = async () => {
    setLoading(true);
    const params = {};
    if (statusFilter) params.status = statusFilter;
    const res = await api.get('/papers', { params });
    setItems(res.data);
    setLoading(false);
  };
  useEffect(() => { load(); }, [statusFilter]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setFile(null); setModalOpen(true); };
  const openEdit = (item) => { setEditing(item); setForm(item); setFile(null); setModalOpen(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v !== undefined && k !== '_id') fd.append(k, v); });
    if (file) fd.append('file', file);
    if (editing) await api.put(`/papers/${editing._id}`, fd);
    else await api.post('/papers', fd);
    setModalOpen(false);
    load();
  };

  const quickStatusChange = async (paper, status) => { await api.put(`/papers/${paper._id}`, { status }); load(); };
  const handleDelete = async () => { await api.delete(`/papers/${deleteId}`); setDeleteId(null); load(); };

  if (loading) return <Loading />;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Paper Work</h1>
        {user && (
        <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
          <Plus size={16} /> New Paper
        </button>
        )}
      </div>

      <div className="mb-4">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
          <option value="">All statuses</option>
          <option>Draft</option><option>Under Review</option><option>Revision</option><option>Completed</option>
        </select>
      </div>

      <div className="space-y-4">
        {items.map((p) => (
          <div key={p._id} className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-800">{p.title}</h3>
                  {user ? (
                    <select value={p.status} onChange={(e) => quickStatusChange(p, e.target.value)}
                      className={`rounded-full border-none px-2 py-0.5 text-xs font-medium ${statusColors[p.status]}`}>
                      <option>Draft</option><option>Under Review</option><option>Revision</option><option>Completed</option>
                    </select>
                  ) : (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[p.status]}`}>{p.status}</span>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-500">{p.authors}</p>
                <p className="mt-2 text-sm text-gray-600">{p.abstract}</p>
                {p.fileUrl && <a href={p.fileUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-brand-600"><FileText size={12}/>View Document</a>}
              </div>
              <div className="flex shrink-0 gap-2">
                {user && <button onClick={() => openEdit(p)} className="text-gray-400 hover:text-brand-600"><Pencil size={16} /></button>}
                {isAdmin && <button onClick={() => setDeleteId(p._id)} className="text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>}
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-gray-400">No paper work records yet.</p>}
      </div>

      <Modal open={modalOpen} title={editing ? 'Edit Paper' : 'New Paper'} onClose={() => setModalOpen(false)} wide>
        <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          <input required placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-lg border px-3 py-2" />
          <input placeholder="Authors" value={form.authors} onChange={(e) => setForm({ ...form, authors: e.target.value })} className="w-full rounded-lg border px-3 py-2" />
          <input placeholder="Keywords" value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} className="w-full rounded-lg border px-3 py-2" />
          {['abstract', 'introduction', 'methodology', 'results', 'discussion', 'conclusion', 'references'].map((field) => (
            <textarea key={field} placeholder={field[0].toUpperCase() + field.slice(1)} rows={2} value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} className="w-full rounded-lg border px-3 py-2" />
          ))}
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-lg border px-3 py-2">
            <option>Draft</option><option>Under Review</option><option>Revision</option><option>Completed</option>
          </select>
          <FileUpload label="Paper File (PDF/DOC/PPT)" accept=".pdf,.doc,.docx,.ppt,.pptx" onFileSelect={setFile} existingUrl={editing?.fileUrl} />
          <button className="w-full rounded-lg bg-brand-600 py-2 font-medium text-white hover:bg-brand-700">{editing ? 'Save Changes' : 'Create Paper'}</button>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} message="This paper record will be permanently deleted." onCancel={() => setDeleteId(null)} onConfirm={handleDelete} />
    </div>
  );
};

export default PaperWork;
