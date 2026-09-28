import { useState } from 'react';
import { Plus, Pencil, Trash2, Search, FileText, Shapes, ExternalLink } from 'lucide-react';
import api, { errMsg } from '../services/api';
import { useQuery, useDebounced, setQueryData, invalidate } from '../lib/query';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import FileUpload from '../components/FileUpload';
import { toast } from '../components/Toast';
import { PageHeader, EmptyState, Field, Button } from '../components/ui';
import { CardGridSkeleton } from '../components/Loading';
import { useAuth } from '../context/AuthContext';

const emptyForm = { name: '', category: '', description: '' };

const Elements = () => {
  const { isAdmin, user } = useAuth();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const params = { search: useDebounced(search), category: useDebounced(category) };
  const { data: items, loading, refreshing } = useQuery('/elements', params);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [docFile, setDocFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setImageFile(null); setDocFile(null); setModalOpen(true); };
  const openEdit = (item) => { setEditing(item); setForm(item); setImageFile(null); setDocFile(null); setModalOpen(true); };

  // Elements can carry two files (image + document), so: save the record,
  // then attach whichever file(s) were chosen.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let saved;
      const basePayload = { name: form.name, category: form.category, description: form.description };
      saved = editing
        ? (await api.put(`/elements/${editing._id}`, basePayload)).data
        : (await api.post('/elements', basePayload)).data;

      if (imageFile) {
        const fd = new FormData();
        fd.append('image', imageFile);
        fd.append('__urlField', 'image');
        saved = (await api.put(`/elements/${saved._id}`, fd)).data;
      }
      if (docFile) {
        const fd = new FormData();
        fd.append('file', docFile);
        fd.append('__urlField', 'documentUrl');
        saved = (await api.put(`/elements/${saved._id}`, fd)).data;
      }
      setModalOpen(false);
      toast(editing ? 'Element updated' : 'Element added');
      invalidate('/elements');
    } catch (err) {
      toast.error(errMsg(err, 'Could not save'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const id = deleteId;
    setDeleteId(null);
    setQueryData('/elements', params, (list = []) => list.filter((x) => x._id !== id));
    try {
      await api.delete(`/elements/${id}`);
      toast('Element deleted');
    } catch (err) {
      toast.error(errMsg(err, 'Delete failed'));
    }
    invalidate('/elements');
  };

  return (
    <div>
      <PageHeader eyebrow="Resources" title="Elements" subtitle="Diagrams, datasheets, CAD files and other building blocks." refreshing={refreshing && !loading}>
        {user && <button onClick={openCreate} className="btn-primary"><Plus size={16} /> Add element</button>}
      </PageHeader>

      <div className="mb-6 flex flex-wrap gap-3">
        <div className="search-box w-full sm:w-80">
          <Search size={16} className="text-slate-500" />
          <input placeholder="Search elements…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <input placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} className="input w-44" />
      </div>

      {loading ? (
        <CardGridSkeleton tall />
      ) : items.length === 0 ? (
        <EmptyState icon={Shapes} title="No elements yet" hint={search || category ? 'Nothing matches that filter.' : 'Upload a datasheet, wiring diagram or image.'} />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((el) => (
            <div key={el._id} className="card card-hover group flex flex-col overflow-hidden">
              <div className="relative flex h-40 items-center justify-center overflow-hidden bg-gradient-to-br from-ink-700 to-ink-900">
                {el.image ? (
                  <img src={el.image} alt={el.name} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                ) : (
                  <Shapes size={38} className="text-slate-700" />
                )}
                <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition group-hover:opacity-100 max-md:opacity-100">
                  {user && <button onClick={() => openEdit(el)} className="icon-btn bg-ink-950/70" aria-label="Edit"><Pencil size={15} /></button>}
                  {isAdmin && <button onClick={() => setDeleteId(el._id)} className="icon-btn-danger bg-ink-950/70" aria-label="Delete"><Trash2 size={15} /></button>}
                </div>
              </div>
              <div className="flex flex-1 flex-col p-5">
                {el.category && <p className="font-mono text-xs text-cyan-300/80">{el.category}</p>}
                <h3 className="mt-0.5 text-lg font-semibold leading-snug">{el.name}</h3>
                {el.description && <p className="mt-2 line-clamp-2 text-sm text-slate-400">{el.description}</p>}
                {el.documentUrl && (
                  <a href={el.documentUrl} target="_blank" rel="noreferrer" className="btn-secondary btn-sm mt-auto w-fit translate-y-2 py-2">
                    <FileText size={13} /> Open document <ExternalLink size={11} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} title={editing ? 'Edit element' : 'Add element'} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Name">
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
          </Field>
          <Field label="Category">
            <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input" />
          </Field>
          <Field label="Description">
            <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" />
          </Field>
          <FileUpload label="Image" accept="image/*" onFileSelect={setImageFile} existingUrl={editing?.image} />
          <FileUpload label="Document" accept=".pdf,.doc,.docx,.ppt,.pptx" onFileSelect={setDocFile} existingUrl={editing?.documentUrl} />
          <Button loading={saving} className="btn-primary w-full py-3">{editing ? 'Save changes' : 'Add element'}</Button>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} message="This element will be permanently deleted." onCancel={() => setDeleteId(null)} onConfirm={handleDelete} />
    </div>
  );
};

export default Elements;
