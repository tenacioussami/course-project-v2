import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import api from '../services/api';
import Loading from '../components/Loading';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import FileUpload from '../components/FileUpload';
import { useAuth } from '../context/AuthContext';

const emptyForm = { paperTitle: '', authors: '', publicationYear: '', journal: '', doi: '', abstract: '', content: '', keyFindings: '', researchGap: '', referenceLink: '' };

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
  const [expandedId, setExpandedId] = useState(null); // which paper's details are shown inline

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

  // Custom image handler for the Quill toolbar — uploads to Cloudinary via our backend
  const imageHandler = function () {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();
    input.onchange = async () => {
      const selected = input.files[0];
      if (!selected) return;
      const fd = new FormData();
      fd.append('image', selected);
      const res = await api.post('/upload/image', fd);
      const url = res.data.url;
      const quill = this.quill;
      const range = quill.getSelection(true);
      quill.insertEmbed(range.index, 'image', url);
      quill.setSelection(range.index + 1);
    };
  };

  const quillModules = {
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link', 'image'],
        ['clean'],
      ],
      handlers: { image: imageHandler },
    },
  };

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

  const toggleExpand = (id) => setExpandedId((prev) => (prev === id ? null : id));

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
                onClick={() => { setActiveAuthorId(id); setExpandedId(null); }}
                className={`rounded-lg px-4 py-3 text-base font-semibold transition ${
                  active ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                {author?.name || 'Unknown'}
              </button>
            );
          })}
        </div>
      )}

      {/* Titles + inline expandable details for the selected member */}
      <div className="space-y-3">
        {currentPapers.map((lit) => {
          const isOpen = expandedId === lit._id;
          return (
            <div key={lit._id} className="overflow-hidden rounded-xl border bg-white shadow-sm">
              <div className="flex items-center justify-between gap-3 p-5">
                <button
                  onClick={() => toggleExpand(lit._id)}
                  className="flex flex-1 items-center gap-2 text-left text-lg font-semibold text-brand-700 hover:underline"
                >
                  {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  {lit.paperTitle}
                </button>
                <div className="flex shrink-0 gap-2">
                  {lit.pdfUrl && (
                    <a href={lit.pdfUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm text-brand-600 hover:underline">
                      <FileText size={14} /> PDF
                    </a>
                  )}
                  {user && <button onClick={() => openEdit(lit)} className="text-gray-400 hover:text-brand-600"><Pencil size={16} /></button>}
                  {isAdmin && <button onClick={() => setDeleteId(lit._id)} className="text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>}
                </div>
              </div>

              {isOpen && (
                <div className="border-t bg-gray-50 px-6 py-5">
                  <p className="mb-3 text-base text-gray-600">
                    {lit.authors} · {lit.publicationYear} · {lit.journal}
                  </p>

                  {lit.content ? (
                    <div
                      className="prose prose-base max-w-none text-gray-800 prose-img:rounded-lg prose-img:shadow"
                      dangerouslySetInnerHTML={{ __html: lit.content }}
                    />
                  ) : (
                    <div className="space-y-3 text-base leading-relaxed text-gray-700">
                      {lit.abstract && (
                        <p><span className="font-semibold text-gray-900">Abstract: </span>{lit.abstract}</p>
                      )}
                      {lit.keyFindings && (
                        <p><span className="font-semibold text-gray-900">Key Findings: </span>{lit.keyFindings}</p>
                      )}
                      {lit.researchGap && (
                        <p><span className="font-semibold text-gray-900">Research Gap: </span>{lit.researchGap}</p>
                      )}
                      {!lit.abstract && !lit.keyFindings && !lit.researchGap && (
                        <p className="text-gray-400">No additional text was added for this paper.</p>
                      )}
                    </div>
                  )}

                  {lit.referenceLink && (
                    <a href={lit.referenceLink} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm text-brand-600 hover:underline">
                      Reference Link
                    </a>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {currentPapers.length === 0 && <p className="text-sm text-gray-400">No literature added yet.</p>}
      </div>

      <Modal open={modalOpen} title={editing ? 'Edit Paper' : 'Add New Paper'} onClose={() => setModalOpen(false)} wide>
        <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          <input required placeholder="Paper title" value={form.paperTitle} onChange={(e) => setForm({ ...form, paperTitle: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-base" />
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Authors" value={form.authors} onChange={(e) => setForm({ ...form, authors: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-base" />
            <input placeholder="Publication Year" type="number" value={form.publicationYear} onChange={(e) => setForm({ ...form, publicationYear: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-base" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Journal/Conference" value={form.journal} onChange={(e) => setForm({ ...form, journal: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-base" />
            <input placeholder="DOI" value={form.doi} onChange={(e) => setForm({ ...form, doi: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-base" />
          </div>
          <textarea placeholder="Short abstract (used if you don't write full content below)" rows={2} value={form.abstract} onChange={(e) => setForm({ ...form, abstract: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-base" />
          <textarea placeholder="Key Findings" rows={2} value={form.keyFindings} onChange={(e) => setForm({ ...form, keyFindings: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-base" />
          <textarea placeholder="Research Gap" rows={2} value={form.researchGap} onChange={(e) => setForm({ ...form, researchGap: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-base" />
          <input placeholder="Reference Link" value={form.referenceLink} onChange={(e) => setForm({ ...form, referenceLink: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-base" />

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Full Review (you can add pictures here)</label>
            <ReactQuill
              theme="snow"
              value={form.content}
              onChange={(val) => setForm({ ...form, content: val })}
              modules={quillModules}
              className="bg-white"
            />
          </div>

          <FileUpload label="PDF File (optional)" accept="application/pdf" onFileSelect={setFile} existingUrl={editing?.pdfUrl} />
          <button className="w-full rounded-lg bg-brand-600 py-2 font-medium text-white hover:bg-brand-700">{editing ? 'Save Changes' : 'Add Paper'}</button>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} message="This literature entry will be permanently deleted." onCancel={() => setDeleteId(null)} onConfirm={handleDelete} />
    </div>
  );
};

export default LiteratureReview;