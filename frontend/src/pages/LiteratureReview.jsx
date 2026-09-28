import { lazy, Suspense, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Search, ChevronDown, BookOpen } from 'lucide-react';
import api, { errMsg } from '../services/api';
import { useQuery, useDebounced, setQueryData, invalidate } from '../lib/query';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { toast } from '../components/Toast';
import { PageHeader, EmptyState, Field, Button, Avatar } from '../components/ui';
import { ListSkeleton, Skeleton } from '../components/Loading';
import { useAuth } from '../context/AuthContext';

// The rich-text editor is heavy — load it only when someone opens the editor.
const RichEditor = lazy(() => import('../components/RichEditor'));

const emptyForm = { paperTitle: '', journal: '', publicationYear: '', content: '' };

const LiteratureReview = () => {
  const { isAdmin, user } = useAuth();
  const [search, setSearch] = useState('');
  const [year, setYear] = useState('');
  const q = useDebounced(search);
  const y = useDebounced(year);
  const params = { search: q, year: y };
  const { data: items, loading, refreshing } = useQuery('/literature', params);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [activeAuthorId, setActiveAuthorId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (item) => { setEditing(item); setForm(item); setModalOpen(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      paperTitle: form.paperTitle,
      journal: form.journal,
      publicationYear: form.publicationYear,
      content: form.content,
    };
    try {
      if (editing) await api.put(`/literature/${editing._id}`, payload);
      else await api.post('/literature', payload);
      setModalOpen(false);
      toast(editing ? 'Review updated' : 'Paper added');
      invalidate('/literature');
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
    setQueryData('/literature', params, (list = []) => list.filter((l) => l._id !== id));
    try {
      await api.delete(`/literature/${id}`);
      toast('Paper deleted');
    } catch (err) {
      toast.error(errMsg(err, 'Delete failed'));
    }
    invalidate('/literature');
    invalidate('/dashboard');
  };

  const { authors, grouped } = useMemo(() => {
    const a = [];
    const g = {};
    (items || []).forEach((lit) => {
      const author = lit.createdBy;
      const id = author?._id || 'unknown';
      if (!g[id]) { g[id] = { author, papers: [] }; a.push(id); }
      g[id].papers.push(lit);
    });
    return { authors: a, grouped: g };
  }, [items]);

  const currentAuthorId = activeAuthorId && grouped[activeAuthorId] ? activeAuthorId : authors[0];
  const currentPapers = currentAuthorId ? grouped[currentAuthorId].papers : [];
  const toggleExpand = (id) => setExpandedId((prev) => (prev === id ? null : id));

  return (
    <div>
      <PageHeader eyebrow="Research" title="Literature review" subtitle="Papers on human-following robots, obstacle avoidance, smart carts and vision navigation." refreshing={refreshing && !loading}>
        {user && (
          <button onClick={openCreate} className="btn-primary"><Plus size={16} /> Add paper</button>
        )}
      </PageHeader>

      <div className="mb-5 flex flex-wrap gap-3">
        <div className="search-box w-full sm:w-80">
          <Search size={16} className="text-slate-500" />
          <input placeholder="Search papers…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <input placeholder="Year" inputMode="numeric" value={year} onChange={(e) => setYear(e.target.value)} className="input w-28" />
      </div>

      {authors.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {authors.map((id) => {
            const { author, papers } = grouped[id];
            const active = id === currentAuthorId;
            return (
              <button
                key={id}
                onClick={() => { setActiveAuthorId(id); setExpandedId(null); }}
                className={`flex items-center gap-2.5 rounded-full border py-1.5 pl-1.5 pr-4 text-sm font-semibold transition ${
                  active ? 'border-cyan-400/40 bg-cyan-400/10 text-white shadow-glow' : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20'
                }`}
              >
                <Avatar name={author?.name || '?'} size={26} />
                {author?.name || 'Unknown'}
                <span className="font-mono text-xs text-slate-500">{papers.length}</span>
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <ListSkeleton rows={4} />
      ) : currentPapers.length === 0 ? (
        <EmptyState icon={BookOpen} title="No literature yet" hint={search || year ? 'Nothing matches that search.' : 'Add the first paper review.'} />
      ) : (
        <div className="space-y-3">
          {currentPapers.map((lit) => {
            const isOpen = expandedId === lit._id;
            return (
              <div key={lit._id} className={`card overflow-hidden transition ${isOpen ? 'border-cyan-400/25' : ''}`}>
                <div className="flex items-center gap-3 p-5">
                  <button onClick={() => toggleExpand(lit._id)} className="flex flex-1 items-center gap-4 text-left">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition ${isOpen ? 'bg-cyan-400/15 text-cyan-300' : 'bg-white/[0.05] text-slate-400'}`}>
                      <ChevronDown size={18} className={`transition ${isOpen ? 'rotate-180' : ''}`} />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-display text-lg font-semibold leading-snug text-white">{lit.paperTitle}</span>
                      <span className="mt-0.5 block font-mono text-xs text-slate-500">{[lit.journal, lit.publicationYear].filter(Boolean).join(' · ') || '—'}</span>
                    </span>
                  </button>
                  <div className="flex shrink-0 gap-1">
                    {user && <button onClick={() => openEdit(lit)} className="icon-btn" aria-label="Edit"><Pencil size={15} /></button>}
                    {isAdmin && <button onClick={() => setDeleteId(lit._id)} className="icon-btn-danger" aria-label="Delete"><Trash2 size={15} /></button>}
                  </div>
                </div>

                {isOpen && (
                  <div className="animate-fade-up border-t border-white/[0.06] bg-white/[0.015] px-6 py-6 sm:px-8">
                    {lit.content ? (
                      <div className="rich" dangerouslySetInnerHTML={{ __html: lit.content }} />
                    ) : (
                      <p className="text-slate-500">No review text was added for this paper.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} title={editing ? 'Edit paper' : 'Add paper'} onClose={() => setModalOpen(false)} wide>
        <form onSubmit={handleSubmit} className="max-h-[72vh] space-y-4 overflow-y-auto pr-1">
          <Field label="Paper title">
            <input required value={form.paperTitle} onChange={(e) => setForm({ ...form, paperTitle: e.target.value })} className="input" />
          </Field>
          <div className="grid grid-cols-[1fr_120px] gap-3">
            <Field label="Journal / conference">
              <input value={form.journal} onChange={(e) => setForm({ ...form, journal: e.target.value })} className="input" />
            </Field>
            <Field label="Year">
              <input type="number" value={form.publicationYear} onChange={(e) => setForm({ ...form, publicationYear: e.target.value })} className="input" />
            </Field>
          </div>
          <Field label="Full review (you can add pictures)">
            <Suspense fallback={<Skeleton className="h-52 w-full rounded-xl" />}>
              {modalOpen && <RichEditor value={form.content} onChange={(val) => setForm((f) => ({ ...f, content: val }))} />}
            </Suspense>
          </Field>
          <Button loading={saving} className="btn-primary w-full py-3">{editing ? 'Save changes' : 'Add paper'}</Button>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} message="This literature entry will be permanently deleted." onCancel={() => setDeleteId(null)} onConfirm={handleDelete} />
    </div>
  );
};

export default LiteratureReview;
