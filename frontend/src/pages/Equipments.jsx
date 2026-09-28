import { useState } from 'react';
import { Plus, Pencil, Trash2, Search, Cpu, MapPin, Package } from 'lucide-react';
import api, { errMsg } from '../services/api';
import { useQuery, useDebounced, setQueryData, invalidate } from '../lib/query';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import FileUpload from '../components/FileUpload';
import { toast } from '../components/Toast';
import { PageHeader, EmptyState, Field, Button, Badge } from '../components/ui';
import { CardGridSkeleton } from '../components/Loading';
import { useAuth } from '../context/AuthContext';

const emptyForm = { name: '', category: '', quantity: 1, availability: true, condition: 'Good', location: '', description: '' };
const conditionTone = { New: 'green', Good: 'cyan', Fair: 'amber', Poor: 'rose' };

const Equipments = () => {
  const { isAdmin, user } = useAuth();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const params = { search: useDebounced(search), category: useDebounced(category) };
  const { data: items, loading, refreshing } = useQuery('/equipment', params);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setFile(null); setModalOpen(true); };
  const openEdit = (item) => { setEditing(item); setForm(item); setFile(null); setModalOpen(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== undefined && v !== null && !['_id', '__v', 'createdBy', 'createdAt', 'updatedAt'].includes(k)) fd.append(k, v);
      });
      if (file) fd.append('image', file);
      if (editing) await api.put(`/equipment/${editing._id}`, fd);
      else await api.post('/equipment', fd);
      setModalOpen(false);
      toast(editing ? 'Equipment updated' : 'Equipment added');
      invalidate('/equipment');
      invalidate('/dashboard');
    } catch (err) {
      toast.error(errMsg(err, 'Could not save'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const id = deleteId;
    setDeleteId(null);
    setQueryData('/equipment', params, (list = []) => list.filter((x) => x._id !== id));
    try {
      await api.delete(`/equipment/${id}`);
      toast('Equipment deleted');
    } catch (err) {
      toast.error(errMsg(err, 'Delete failed'));
    }
    invalidate('/equipment');
    invalidate('/dashboard');
  };

  return (
    <div>
      <PageHeader eyebrow="Hardware" title="Equipments" subtitle="Controllers, sensors, motors and everything on the bench." refreshing={refreshing && !loading}>
        {user && <button onClick={openCreate} className="btn-primary"><Plus size={16} /> Add equipment</button>}
      </PageHeader>

      <div className="mb-6 flex flex-wrap gap-3">
        <div className="search-box w-full sm:w-80">
          <Search size={16} className="text-slate-500" />
          <input placeholder="Search equipment…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <input placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} className="input w-44" />
      </div>

      {loading ? (
        <CardGridSkeleton tall />
      ) : items.length === 0 ? (
        <EmptyState icon={Cpu} title="No equipment recorded" hint={search || category ? 'Nothing matches that filter.' : 'Add the ESP32, sensors, motors…'} />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((eq) => (
            <div key={eq._id} className="card card-hover group overflow-hidden">
              <div className="relative flex h-44 items-center justify-center overflow-hidden bg-gradient-to-br from-ink-700 to-ink-900">
                {eq.image ? (
                  <img src={eq.image} alt={eq.name} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                ) : (
                  <Cpu size={40} className="text-slate-700" />
                )}
                <span className={`absolute left-3 top-3 badge ${eq.availability ? 'bg-emerald-400/15 text-emerald-300 ring-emerald-400/30' : 'bg-rose-400/15 text-rose-300 ring-rose-400/30'} backdrop-blur`}>
                  {eq.availability ? '● Available' : '● In use'}
                </span>
                <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition group-hover:opacity-100 max-md:opacity-100">
                  {user && <button onClick={() => openEdit(eq)} className="icon-btn bg-ink-950/70" aria-label="Edit"><Pencil size={15} /></button>}
                  {isAdmin && <button onClick={() => setDeleteId(eq._id)} className="icon-btn-danger bg-ink-950/70" aria-label="Delete"><Trash2 size={15} /></button>}
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg font-semibold leading-snug">{eq.name}</h3>
                  <Badge tone={conditionTone[eq.condition] || 'slate'}>{eq.condition}</Badge>
                </div>
                {eq.category && <p className="mt-0.5 font-mono text-xs text-cyan-300/80">{eq.category}</p>}
                {eq.description && <p className="mt-2 line-clamp-2 text-sm text-slate-400">{eq.description}</p>}
                <div className="mt-4 flex items-center gap-4 border-t border-white/[0.06] pt-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5"><Package size={13} /> Qty {eq.quantity}</span>
                  {eq.location && <span className="flex items-center gap-1.5 truncate"><MapPin size={13} /> {eq.location}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} title={editing ? 'Edit equipment' : 'Add equipment'} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Name">
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" placeholder="e.g. ESP32-S3 N16R8" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input" placeholder="Sensor" />
            </Field>
            <Field label="Quantity">
              <input type="number" min="0" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="input" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Condition">
              <select value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} className="input">
                <option>New</option><option>Good</option><option>Fair</option><option>Poor</option>
              </select>
            </Field>
            <Field label="Availability">
              <select value={String(form.availability)} onChange={(e) => setForm({ ...form, availability: e.target.value === 'true' })} className="input">
                <option value="true">Available</option><option value="false">Not available</option>
              </select>
            </Field>
          </div>
          <Field label="Location">
            <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="input" />
          </Field>
          <Field label="Description">
            <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" />
          </Field>
          <FileUpload label="Equipment image" accept="image/*" onFileSelect={setFile} existingUrl={editing?.image} />
          <Button loading={saving} className="btn-primary w-full py-3">{editing ? 'Save changes' : 'Add equipment'}</Button>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} message="This equipment record will be permanently deleted." onCancel={() => setDeleteId(null)} onConfirm={handleDelete} />
    </div>
  );
};

export default Equipments;
