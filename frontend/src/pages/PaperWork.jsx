import { useState } from 'react';
import { Plus, Pencil, Trash2, FileText, ExternalLink } from 'lucide-react';
import api, { errMsg } from '../services/api';
import { useQuery, setQueryData, invalidate } from '../lib/query';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import FileUpload from '../components/FileUpload';
import { toast } from '../components/Toast';
import { PageHeader, EmptyState, Field, Button, Badge } from '../components/ui';
import { ListSkeleton } from '../components/Loading';
import { useAuth } from '../context/AuthContext';

const emptyForm = { title: '', authors: '', abstract: '', keywords: '', introduction: '', methodology: '', results: '', discussion: '', conclusion: '', references: '', status: 'Draft' };
const STATUSES = ['Draft', 'Under Review', 'Revision', 'Completed'];
const statusTone = { Draft: 'slate', 'Under Review': 'amber', Revision: 'orange', Completed: 'green' };
const statusSelect = {
  Draft: 'bg-slate-400/10 text-slate-300 ring-slate-400/20',
  'Under Review': 'bg-amber-400/10 text-amber-300 ring-amber-400/25',
  Revision: 'bg-orange-400/10 text-orange-300 ring-orange-400/25',
  Completed: 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/25',
};

const PaperWork = () => {
  const { isAdmin, user } = useAuth();
  const [statusFilter, setStatusFilter] = useState('');
  const params = { status: statusFilter };
  const { data: items, loading, refreshing } = useQuery('/papers', params);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setFile(null); setModalOpen(true); };
  const openEdit = (item) => { setEditing(item); setForm({ ...emptyForm, ...item }); setFile(null); setModalOpen(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== undefined && v !== null && !['_id', '__v', 'createdBy', 'createdAt', 'updatedAt'].includes(k)) fd.append(k, v);
      });
      if (file) fd.append('file', file);
      if (editing) await api.put(`/papers/${editing._id}`, fd);
      else await api.post('/papers', fd);
      setModalOpen(false);
      toast(editing ? 'Paper updated' : 'Paper created');
      invalidate('/papers');
      invalidate('/dashboard');
    } catch (err) {
      toast.error(errMsg(err, 'Could not save'));
    } finally {
      setSaving(false);
    }
  };

  const quickStatusChange = async (paper, status) => {
    setQueryData('/papers', params, (list = []) => list.map((p) => (p._id === paper._id ? { ...p, status } : p)));
    try {
      await api.put(`/papers/${paper._id}`, { status });
    } catch (err) {
      toast.error(errMsg(err, 'Could not update status'));
      invalidate('/papers');
    }
  };

  const handleDelete = async () => {
    const id = deleteId;
    setDeleteId(null);
    setQueryData('/papers', params, (list = []) => list.filter((p) => p._id !== id));
    try {
      await api.delete(`/papers/${id}`);
      toast('Paper deleted');
    } catch (err) {
      toast.error(errMsg(err, 'Delete failed'));
    }
    invalidate('/papers');
    invalidate('/dashboard');
  };

  return (
    <div>
      <PageHeader eyebrow="Writing" title="Paper work" subtitle="Drafts, reports and submissions for CarryBot." refreshing={refreshing && !loading}>
        {user && <button onClick={openCreate} className="btn-primary"><Plus size={16} /> New paper</button>}
      </PageHeader>

      <div className="mb-6 flex w-fit flex-wrap rounded-xl border border-white/10 bg-white/[0.03] p-1">
        {['', ...STATUSES].map((s) => (
          <button key={s || 'all'} onClick={() => setStatusFilter(s)} className={`tab py-1.5 text-xs ${statusFilter === s ? 'tab-active' : ''}`}>{s || 'All'}</button>
        ))}
      </div>

      {loading ? (
        <ListSkeleton rows={3} />
      ) : items.length === 0 ? (
        <EmptyState icon={FileText} title="No paper work yet" hint={statusFilter ? 'Nothing with that status.' : 'Start a draft for the project report.'} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((p) => (
            <div key={p._id} className="card card-hover flex flex-col p-6">
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300 ring-1 ring-white/10">
                  <FileText size={18} />
                </span>
                <div className="flex items-center gap-1">
                  {user ? (
                    <select value={p.status} onChange={(e) => quickStatusChange(p, e.target.value)}
                      className={`cursor-pointer rounded-full border-0 px-2.5 py-1 text-[11px] font-semibold outline-none ring-1 ring-inset ${statusSelect[p.status]}`}>
                      {STATUSES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  ) : (
                    <Badge tone={statusTone[p.status]}>{p.status}</Badge>
                  )}
                  {user && <button onClick={() => openEdit(p)} className="icon-btn" aria-label="Edit"><Pencil size={15} /></button>}
                  {isAdmin && <button onClick={() => setDeleteId(p._id)} className="icon-btn-danger" aria-label="Delete"><Trash2 size={15} /></button>}
                </div>
              </div>
              <h3 className="mt-4 text-lg font-semibold leading-snug">{p.title}</h3>
              {p.authors && <p className="mt-1 text-sm text-slate-400">{p.authors}</p>}
              {p.abstract && <p className="mt-3 line-clamp-3 text-sm text-slate-400">{p.abstract}</p>}
              {p.keywords && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.keywords.split(',').map((k) => k.trim()).filter(Boolean).map((k) => <span key={k} className="chip">{k}</span>)}
                </div>
              )}
              {p.fileUrl && (
                <a href={p.fileUrl} target="_blank" rel="noreferrer" className="btn-secondary btn-sm mt-5 w-fit py-2">
                  <ExternalLink size={13} /> View document
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} title={editing ? 'Edit paper' : 'New paper'} onClose={() => setModalOpen(false)} wide>
        <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          <Field label="Title">
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Authors">
              <input value={form.authors} onChange={(e) => setForm({ ...form, authors: e.target.value })} className="input" />
            </Field>
            <Field label="Keywords (comma separated)">
              <input value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} className="input" />
            </Field>
          </div>
          {['abstract', 'introduction', 'methodology', 'results', 'discussion', 'conclusion', 'references'].map((field) => (
            <Field key={field} label={field[0].toUpperCase() + field.slice(1)}>
              <textarea rows={field === 'abstract' ? 3 : 2} value={form[field] || ''} onChange={(e) => setForm({ ...form, [field]: e.target.value })} className="input" />
            </Field>
          ))}
          <Field label="Status">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {STATUSES.map((s) => (
                <button type="button" key={s} onClick={() => setForm({ ...form, status: s })}
                  className={`rounded-xl border px-2 py-2 text-xs font-semibold transition ${form.status === s ? 'border-cyan-400/50 bg-cyan-400/10 text-cyan-200' : 'border-white/10 text-slate-400 hover:border-white/20'}`}>{s}</button>
              ))}
            </div>
          </Field>
          <FileUpload label="Paper file (PDF / DOC / PPT)" accept=".pdf,.doc,.docx,.ppt,.pptx" onFileSelect={setFile} existingUrl={editing?.fileUrl} />
          <Button loading={saving} className="btn-primary w-full py-3">{editing ? 'Save changes' : 'Create paper'}</Button>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} message="This paper record will be permanently deleted." onCancel={() => setDeleteId(null)} onConfirm={handleDelete} />
    </div>
  );
};

export default PaperWork;
