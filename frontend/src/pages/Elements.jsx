import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search, FileText } from 'lucide-react';
import api from '../services/api';
import Loading from '../components/Loading';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import FileUpload from '../components/FileUpload';
import { useAuth } from '../context/AuthContext';

const emptyForm = { name: '', category: '', description: '' };

const Elements = () => {
  const { isAdmin, user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [docFile, setDocFile] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  const load = async () => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (category) params.category = category;
    const res = await api.get('/elements', { params });
    setItems(res.data);
    setLoading(false);
  };
  useEffect(() => { load(); }, [search, category]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setImageFile(null); setDocFile(null); setModalOpen(true); };
  const openEdit = (item) => { setEditing(item); setForm(item); setImageFile(null); setDocFile(null); setModalOpen(true); };

  // Elements need two possible files (image + document), so we do up to two requests:
  // first save/create the record, then patch with whichever file was chosen.
  const handleSubmit = async (e) => {
    e.preventDefault();
    let saved;
    const basePayload = { name: form.name, category: form.category, description: form.description };

    if (editing) {
      saved = (await api.put(`/elements/${editing._id}`, basePayload)).data;
    } else {
      saved = (await api.post('/elements', basePayload)).data;
    }

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
    load();
  };

  const handleDelete = async () => { await api.delete(`/elements/${deleteId}`); setDeleteId(null); load(); };

  if (loading) return <Loading />;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Elements</h1>
        {user && (
        <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
          <Plus size={16} /> Add Element
        </button>
        )}
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2">
          <Search size={16} className="text-gray-400" />
          <input placeholder="Search elements..." value={search} onChange={(e) => setSearch(e.target.value)} className="text-sm outline-none" />
        </div>
        <input placeholder="Filter by category" value={category} onChange={(e) => setCategory(e.target.value)} className="w-44 rounded-lg border px-3 py-2 text-sm" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((el) => (
          <div key={el._id} className="overflow-hidden rounded-xl border bg-white shadow-sm">
            <div className="flex h-32 items-center justify-center bg-gray-50">
              {el.image ? <img src={el.image} alt={el.name} className="h-full w-full object-cover" /> : <span className="text-xs text-gray-300">No image</span>}
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-800">{el.name}</h3>
              <p className="text-xs text-gray-400">{el.category}</p>
              <p className="mt-1 text-sm text-gray-500 line-clamp-2">{el.description}</p>
              {el.documentUrl && <a href={el.documentUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-brand-600"><FileText size={12}/>View Document</a>}
              <div className="mt-3 flex justify-end gap-2 border-t pt-3">
                {user && <button onClick={() => openEdit(el)} className="text-gray-400 hover:text-brand-600"><Pencil size={16} /></button>}
                {isAdmin && <button onClick={() => setDeleteId(el._id)} className="text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>}
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-gray-400">No elements added yet.</p>}
      </div>

      <Modal open={modalOpen} title={editing ? 'Edit Element' : 'Add Element'} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input required placeholder="Element name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border px-3 py-2" />
          <input placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-lg border px-3 py-2" />
          <textarea placeholder="Description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-lg border px-3 py-2" />
          <FileUpload label="Image" accept="image/*" onFileSelect={setImageFile} existingUrl={editing?.image} />
          <FileUpload label="Document" accept=".pdf,.doc,.docx,.ppt,.pptx" onFileSelect={setDocFile} existingUrl={editing?.documentUrl} />
          <button className="w-full rounded-lg bg-brand-600 py-2 font-medium text-white hover:bg-brand-700">{editing ? 'Save Changes' : 'Add Element'}</button>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} message="This element will be permanently deleted." onCancel={() => setDeleteId(null)} onConfirm={handleDelete} />
    </div>
  );
};

export default Elements;
