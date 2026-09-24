import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search, FileText } from 'lucide-react';
import api from '../services/api';
import Loading from '../components/Loading';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import FileUpload from '../components/FileUpload';
import { useAuth } from '../context/AuthContext';

const emptyForm = { paperTitle: '', authors: '', publicationYear: '', journal: '', doi: '', abstract: '', keyFindings: '', researchGap: '', referenceLink: '' };

const LiteratureReview = () => {
  const { isAdmin, user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [search, setSearch] = useState('');
  const [year, setYear] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  const [activeAuthorId, setActiveAuthorId] = useState(null);
  const [viewItem, setViewItem] = useState(null); // for the "view text" modal when no PDF exists

  const load = async () => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (year) params.year = year;
    const res = await api.get('/literature', { params });
    setItems(res.data);
    setLoading(false);
  };
  useEffect(() => { load(); }, [search, year]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setFile(null); setModalOpen(true); };
  const openEdit = (item) => { setEditing(item); setForm(item); setFile(null); setModalOpen(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v !== undefined && k !== '_id') fd.append(k, v); });
    if (file) fd.append('pdf', file);
    if (editing) await api.put(`/literature/${editing._id}`, fd);
    else await api.post('/literature', fd);
    setModalOpen(false);
    load();
  };

  const handleDelete = async () => { await api.delete(`/literature/${deleteId}`); setDeleteId(null); load(); };

  // Group papers by the member who uploaded them (createdBy)
  const authors = [];
  const grouped = {};
  items.forEach((lit) => {
    const author = lit.createdBy;
    const id = author?._id || 'unknown';
    if (!grouped[id]) {
      grouped[id] = { author, papers: [] };
      authors.push(id);
    }
    grouped[id].papers.push(lit);
  });

  const currentAuthorId = activeAuthorId && grouped[activeAuthorId] ? activeAuthorId : authors[0];
  const currentPapers = currentAuthorId ? grouped[currentAuthorId].papers : [];

  const handleTitleClick = (lit) => {
    if (lit.pdfUrl) {
      window.open(lit.pdfUrl, '_blank', 'noopener,noreferrer');
    } else {
      setViewItem(lit);
    }
  };

  if (loading) return <Loading />;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Literature Review</h1>
        {user && (
        <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
          <Plus size={16} /> Add New Paper
        </button>
        )}
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2">
          <Search size={16} className="text-gray-400" />
          <input placeholder="Search papers..." value={search} onChange={(e) => setSearch(e.target.value)} className="text-sm outline-none" />
        </div>
        <input placeholder="Filter by year" value={year} onChange={(e) => setYear(e.target.value)} className="w-32 rounded-lg border px-3 py-2 text-sm" />
      </div>

      {/* Member tabs */}
      {authors.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {authors.map((id) => {
            const { author } = grouped[id];
            const active = id === currentAuthorId;
            return (
              <button
                key={id}
                onClick={() => setActiveAuthorId(id)}
                className={`rounded-lg px-4 py-3 text-sm font-semibold transition ${
                  active ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                {author?.name || 'Unknown'}
              </button>
            );
          })}
        </div>
      )}

      {/* Titles for the selected member */}
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="space-y-3">
          {currentPapers.map((lit) => (
            <div key={lit._id} className="flex items-center justify-between gap-3 border-b pb-3 last:border-0 last:pb-0">
              <button
                onClick={() => handleTitleClick(lit)}
                className="flex items-center gap-2 text-left text-brand-600 hover:underline"
              >
                {lit.pdfUrl && <FileText size={14} />}
                {lit.paperTitle}
              </button>
              <div className="flex shrink-0 gap-2">
                {user && <button onClick={() => openEdit(lit)} className="text-gray-400 hover:text-brand-600"><Pencil size={16} /></button>}
                {isAdmin && <button onClick={() => setDeleteId(lit._id)} className="text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>}
              </div>
            </div>
          ))}
          {currentPapers.length === 0 && <p className="text-sm text-gray-400">No literature added yet.</p>}
        </div>
      </div>

      {/* View modal for papers without an uploaded PDF */}
      <Modal open={!!viewItem} title={viewItem?.paperTitle} onClose={() => setViewItem(null)} wide>
        {viewItem && (
          <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1 text-sm">
            <p className="text-gray-500">{viewItem.authors} · {viewItem.publicationYear} · {viewItem.journal}</p>
            {viewItem.abstract && (
              <div>
                <h4 className="font-semibold text-gray-800">Abstract</h4>
                <p className="text-gray-600">{viewItem.abstract}</p>
              </div>
            )}
            {viewItem.keyFindings && (
              <div>
                <h4 className="font-semibold text-gray-800">Key Findings</h4>
                <p className="text-gray-600">{viewItem.keyFindings}</p>
              </div>
            )}
            {viewItem.researchGap && (
              <div>
                <h4 className="font-semibold text-gray-800">Research Gap</h4>
                <p className="text-gray-600">{viewItem.researchGap}</p>
              </div>
            )}
            {viewItem.referenceLink && (
              <a href={viewItem.referenceLink} target="_blank" rel="noreferrer" className="text-brand-600">
                Reference Link
              </a>
            )}
            {!viewItem.abstract && !viewItem.keyFindings && !viewItem.researchGap && !viewItem.referenceLink && (
              <p className="text-gray-400">No additional text or file was uploaded for this paper.</p>
            )}
          </div>
        )}
      </Modal>

      <Modal open={modalOpen} title={editing ? 'Edit Paper' : 'Add New Paper'} onClose={() => setModalOpen(false)} wide>
        <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          <input required placeholder="Paper title" value={form.paperTitle} onChange={(e) => setForm({ ...form, paperTitle: e.target.value })} className="w-full rounded-lg border px-3 py-2" />
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Authors" value={form.authors} onChange={(e) => setForm({ ...form, authors: e.target.value })} className="w-full rounded-lg border px-3 py-2" />
            <input placeholder="Publication Year" type="number" value={form.publicationYear} onChange={(e) => setForm({ ...form, publicationYear: e.target.value })} className="w-full rounded-lg border px-3 py-2" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Journal/Conference" value={form.journal} onChange={(e) => setForm({ ...form, journal: e.target.value })} className="w-full rounded-lg border px-3 py-2" />
            <input placeholder="DOI" value={form.doi} onChange={(e) => setForm({ ...form, doi: e.target.value })} className="w-full rounded-lg border px-3 py-2" />
          </div>
          <textarea placeholder="Abstract" rows={3} value={form.abstract} onChange={(e) => setForm({ ...form, abstract: e.target.value })} className="w-full rounded-lg border px-3 py-2" />
          <textarea placeholder="Key Findings" rows={2} value={form.keyFindings} onChange={(e) => setForm({ ...form, keyFindings: e.target.value })} className="w-full rounded-lg border px-3 py-2" />
          <textarea placeholder="Research Gap" rows={2} value={form.researchGap} onChange={(e) => setForm({ ...form, researchGap: e.target.value })} className="w-full rounded-lg border px-3 py-2" />
          <input placeholder="Reference Link" value={form.referenceLink} onChange={(e) => setForm({ ...form, referenceLink: e.target.value })} className="w-full rounded-lg border px-3 py-2" />
          <FileUpload label="PDF File" accept="application/pdf" onFileSelect={setFile} existingUrl={editing?.pdfUrl} />
          <button className="w-full rounded-lg bg-brand-600 py-2 font-medium text-white hover:bg-brand-700">{editing ? 'Save Changes' : 'Add Paper'}</button>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} message="This literature entry will be permanently deleted." onCancel={() => setDeleteId(null)} onConfirm={handleDelete} />
    </div>
  );
};

export default LiteratureReview;