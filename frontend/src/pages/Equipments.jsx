import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import api from '../services/api';
import Loading from '../components/Loading';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import FileUpload from '../components/FileUpload';
import { useAuth } from '../context/AuthContext';

const emptyForm = { name: '', category: '', quantity: 1, availability: true, condition: 'Good', location: '', description: '' };

const Equipments = () => {
  const { isAdmin, user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  const load = async () => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (category) params.category = category;
    const res = await api.get('/equipment', { params });
    setItems(res.data);
    setLoading(false);
  };
  useEffect(() => { load(); }, [search, category]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setFile(null); setModalOpen(true); };
  const openEdit = (item) => { setEditing(item); setForm(item); setFile(null); setModalOpen(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v !== undefined && k !== '_id') fd.append(k, v); });
    if (file) fd.append('image', file);
    if (editing) await api.put(`/equipment/${editing._id}`, fd);
    else await api.post('/equipment', fd);
    setModalOpen(false);
    load();
  };

  const handleDelete = async () => { await api.delete(`/equipment/${deleteId}`); setDeleteId(null); load(); };

  if (loading) return <Loading />;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Equipments</h1>
        {user && (
        <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
          <Plus size={16} /> Add Equipment
        </button>
        )}
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2">
          <Search size={16} className="text-gray-400" />
          <input placeholder="Search equipment..." value={search} onChange={(e) => setSearch(e.target.value)} className="text-sm outline-none" />
        </div>
        <input placeholder="Filter by category" value={category} onChange={(e) => setCategory(e.target.value)} className="w-44 rounded-lg border px-3 py-2 text-sm" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((eq) => (
          <div key={eq._id} className="overflow-hidden rounded-xl border bg-white shadow-sm">
            <div className="flex h-36 items-center justify-center bg-gray-50">
              {eq.image ? <img src={eq.image} alt={eq.name} className="h-full w-full object-cover" /> : <span className="text-xs text-gray-300">No image</span>}
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-800">{eq.name}</h3>
              <p className="text-xs text-gray-400">{eq.category}</p>
              <div className="mt-2 space-y-0.5 text-sm text-gray-500">
                <p>Quantity: {eq.quantity}</p>
                <p>Condition: {eq.condition}</p>
                <p>Available: {eq.availability ? 'Yes' : 'No'}</p>
                {eq.location && <p>Location: {eq.location}</p>}
              </div>
              <div className="mt-3 flex justify-end gap-2 border-t pt-3">
                {user && <button onClick={() => openEdit(eq)} className="text-gray-400 hover:text-brand-600"><Pencil size={16} /></button>}
                {isAdmin && <button onClick={() => setDeleteId(eq._id)} className="text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>}
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-gray-400">No equipment recorded yet.</p>}
      </div>

      <Modal open={modalOpen} title={editing ? 'Edit Equipment' : 'Add Equipment'} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input required placeholder="Equipment name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border px-3 py-2" />
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-lg border px-3 py-2" />
            <input type="number" min="0" placeholder="Quantity" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="w-full rounded-lg border px-3 py-2" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} className="w-full rounded-lg border px-3 py-2">
              <option>New</option><option>Good</option><option>Fair</option><option>Poor</option>
            </select>
            <select value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value === 'true' })} className="w-full rounded-lg border px-3 py-2">
              <option value="true">Available</option><option value="false">Not Available</option>
            </select>
          </div>
          <input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full rounded-lg border px-3 py-2" />
          <textarea placeholder="Description" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-lg border px-3 py-2" />
          <FileUpload label="Equipment Image" accept="image/*" onFileSelect={setFile} existingUrl={editing?.image} />
          <button className="w-full rounded-lg bg-brand-600 py-2 font-medium text-white hover:bg-brand-700">{editing ? 'Save Changes' : 'Add Equipment'}</button>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} message="This equipment record will be permanently deleted." onCancel={() => setDeleteId(null)} onConfirm={handleDelete} />
    </div>
  );
};

export default Equipments;
