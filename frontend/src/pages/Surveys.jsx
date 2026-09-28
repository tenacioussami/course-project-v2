import { useState } from 'react';
import { Plus, Trash2, BarChart3, X, ClipboardList, Star } from 'lucide-react';
import api, { errMsg } from '../services/api';
import { useQuery, setQueryData, invalidate } from '../lib/query';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { toast } from '../components/Toast';
import { PageHeader, EmptyState, Field, Button } from '../components/ui';
import { CardGridSkeleton, Skeleton } from '../components/Loading';
import { useAuth } from '../context/AuthContext';

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
const emptyQuestion = () => ({ tempId: uid(), questionText: '', type: 'short_answer', options: [''] });
const typeLabel = { short_answer: 'Short answer', yes_no: 'Yes / No', rating: 'Rating 1–5', multiple_choice: 'Multiple choice' };

const Surveys = () => {
  const { isAdmin, user } = useAuth();
  const { data: surveys, loading, refreshing } = useQuery('/surveys');
  const [createOpen, setCreateOpen] = useState(false);
  const [takeSurvey, setTakeSurvey] = useState(null);
  const [answers, setAnswers] = useState({});
  const [resultsFor, setResultsFor] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', questions: [emptyQuestion()] });

  // Results load through the cache too, so reopening is instant
  const { data: results } = useQuery(resultsFor ? `/surveys/${resultsFor._id}/results` : '/surveys/_none', null, { enabled: !!resultsFor });

  const addQuestion = () => setForm({ ...form, questions: [...form.questions, emptyQuestion()] });
  const removeQuestion = (id) => setForm({ ...form, questions: form.questions.filter((q) => q.tempId !== id) });
  const updateQuestion = (id, updates) => setForm({
    ...form,
    questions: form.questions.map((q) => (q.tempId === id ? { ...q, ...updates } : q)),
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/surveys', {
        title: form.title,
        description: form.description,
        questions: form.questions.map(({ tempId, ...q }) => ({ ...q, options: q.options.filter(Boolean) })),
      });
      setForm({ title: '', description: '', questions: [emptyQuestion()] });
      setCreateOpen(false);
      toast('Survey published');
      invalidate('/surveys');
    } catch (err) {
      toast.error(errMsg(err, 'Could not create survey'));
    } finally {
      setSaving(false);
    }
  };

  const openTake = (survey) => { setTakeSurvey(survey); setAnswers({}); };

  const submitResponse = async (e) => {
    e.preventDefault();
    if (takeSurvey.questions.some((q) => answers[q._id] === undefined || answers[q._id] === '')) {
      toast.error('Please answer every question');
      return;
    }
    setSaving(true);
    try {
      const payload = { answers: Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer })) };
      await api.post(`/surveys/${takeSurvey._id}/responses`, payload);
      invalidate(`/surveys/${takeSurvey._id}/results`);
      setTakeSurvey(null);
      toast('Thanks — response submitted');
    } catch (err) {
      toast.error(errMsg(err, 'Could not submit'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const id = deleteId;
    setDeleteId(null);
    setQueryData('/surveys', null, (list = []) => list.filter((s) => s._id !== id));
    try {
      await api.delete(`/surveys/${id}`);
      toast('Survey deleted');
    } catch (err) {
      toast.error(errMsg(err, 'Delete failed'));
      invalidate('/surveys');
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Feedback" title="Surveys" subtitle="Collect quick input from the team and testers." refreshing={refreshing && !loading}>
        {isAdmin && (
          <button onClick={() => setCreateOpen(true)} className="btn-primary"><Plus size={16} /> New survey</button>
        )}
      </PageHeader>

      {loading ? (
        <CardGridSkeleton count={3} />
      ) : surveys.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No surveys yet" hint={isAdmin ? 'Create one to start collecting responses.' : 'Check back later.'} />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {surveys.map((s) => (
            <div key={s._id} className="card card-hover flex flex-col p-6">
              <div className="mb-4 flex items-start justify-between gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/15 to-violet-500/15 text-cyan-300 ring-1 ring-white/10">
                  <ClipboardList size={18} />
                </span>
                {isAdmin && <button onClick={() => setDeleteId(s._id)} className="icon-btn-danger" aria-label="Delete"><Trash2 size={15} /></button>}
              </div>
              <h3 className="text-lg font-semibold">{s.title}</h3>
              {s.description && <p className="mt-1 line-clamp-2 text-sm text-slate-400">{s.description}</p>}
              <p className="mt-3 font-mono text-xs text-slate-500">{s.questions.length} question{s.questions.length === 1 ? '' : 's'} · by {s.createdBy?.name || '—'}</p>
              <div className="mt-auto flex gap-2 pt-5">
                {user && <button onClick={() => openTake(s)} className="btn-primary btn-sm flex-1 py-2">Take survey</button>}
                <button onClick={() => setResultsFor(s)} className="btn-secondary btn-sm flex-1 py-2"><BarChart3 size={13} /> Results</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create survey */}
      <Modal open={createOpen} title="New survey" onClose={() => setCreateOpen(false)} wide>
        <form onSubmit={handleCreate} className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          <Field label="Title">
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" />
          </Field>
          <Field label="Description">
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" rows={2} />
          </Field>

          <div className="space-y-3">
            {form.questions.map((q, idx) => (
              <div key={q.tempId} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-cyan-300">Q{idx + 1}</span>
                  <input required placeholder="Question text" value={q.questionText} onChange={(e) => updateQuestion(q.tempId, { questionText: e.target.value })} className="input py-2" />
                  {form.questions.length > 1 && (
                    <button type="button" onClick={() => removeQuestion(q.tempId)} className="icon-btn-danger" aria-label="Remove"><X size={15} /></button>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {Object.entries(typeLabel).map(([t, label]) => (
                    <button type="button" key={t} onClick={() => updateQuestion(q.tempId, { type: t })}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${q.type === t ? 'bg-cyan-400/15 text-cyan-200 ring-1 ring-cyan-400/30' : 'text-slate-400 hover:bg-white/[0.05]'}`}>
                      {label}
                    </button>
                  ))}
                </div>
                {q.type === 'multiple_choice' && (
                  <div className="mt-3 space-y-2">
                    {q.options.map((opt, oi) => (
                      <input key={oi} placeholder={`Option ${oi + 1}`} value={opt} onChange={(e) => {
                        const options = [...q.options]; options[oi] = e.target.value;
                        updateQuestion(q.tempId, { options });
                      }} className="input py-2" />
                    ))}
                    <button type="button" onClick={() => updateQuestion(q.tempId, { options: [...q.options, ''] })} className="text-xs font-semibold text-cyan-300 hover:underline">+ Add option</button>
                  </div>
                )}
              </div>
            ))}
          </div>
          <button type="button" onClick={addQuestion} className="btn-secondary w-full border-dashed"><Plus size={15} /> Add question</button>
          <Button loading={saving} className="btn-primary w-full py-3">Publish survey</Button>
        </form>
      </Modal>

      {/* Take survey */}
      <Modal open={!!takeSurvey} title={takeSurvey?.title} onClose={() => setTakeSurvey(null)}>
        {takeSurvey && (
          <form onSubmit={submitResponse} className="space-y-5">
            {takeSurvey.questions.map((q, i) => (
              <div key={q._id}>
                <label className="mb-2 block text-sm font-semibold text-slate-100"><span className="mr-2 font-mono text-xs text-cyan-300">{i + 1}.</span>{q.questionText}</label>
                {q.type === 'short_answer' && (
                  <input required value={answers[q._id] || ''} onChange={(e) => setAnswers({ ...answers, [q._id]: e.target.value })} className="input" />
                )}
                {q.type === 'yes_no' && (
                  <div className="grid grid-cols-2 gap-2">
                    {['Yes', 'No'].map((v) => (
                      <button type="button" key={v} onClick={() => setAnswers({ ...answers, [q._id]: v })}
                        className={`rounded-xl border py-2.5 text-sm font-semibold transition ${answers[q._id] === v ? 'border-cyan-400/50 bg-cyan-400/10 text-cyan-200' : 'border-white/10 text-slate-400 hover:border-white/20'}`}>{v}</button>
                    ))}
                  </div>
                )}
                {q.type === 'rating' && (
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button type="button" key={n} onClick={() => setAnswers({ ...answers, [q._id]: n })} aria-label={`${n} stars`}
                        className={`transition ${answers[q._id] >= n ? 'text-amber-300' : 'text-slate-600 hover:text-slate-400'}`}>
                        <Star size={28} fill={answers[q._id] >= n ? 'currentColor' : 'none'} />
                      </button>
                    ))}
                  </div>
                )}
                {q.type === 'multiple_choice' && (
                  <div className="space-y-2">
                    {q.options.map((opt) => (
                      <label key={opt} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 text-sm transition ${answers[q._id] === opt ? 'border-cyan-400/50 bg-cyan-400/10 text-cyan-100' : 'border-white/10 text-slate-300 hover:border-white/20'}`}>
                        <input type="radio" required name={q._id} checked={answers[q._id] === opt} onChange={() => setAnswers({ ...answers, [q._id]: opt })} className="accent-cyan-400" />
                        {opt}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <Button loading={saving} className="btn-primary w-full py-3">Submit response</Button>
          </form>
        )}
      </Modal>

      {/* Results */}
      <Modal open={!!resultsFor} title={`Results · ${resultsFor?.title || ''}`} onClose={() => setResultsFor(null)} wide>
        {!results ? (
          <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : (
          <div className="space-y-6">
            <p className="font-mono text-xs text-slate-400">{results.responses.length} response{results.responses.length === 1 ? '' : 's'}</p>
            {results.survey.questions.map((q) => {
              const qAnswers = results.responses.map((r) => r.answers.find((a) => a.questionId === q._id)?.answer).filter((a) => a !== undefined);
              const counts = {};
              qAnswers.forEach((a) => { counts[a] = (counts[a] || 0) + 1; });
              return (
                <div key={q._id}>
                  <p className="mb-2.5 text-sm font-semibold text-slate-100">{q.questionText}</p>
                  {q.type === 'short_answer' ? (
                    <ul className="space-y-1.5 text-sm text-slate-300">
                      {qAnswers.map((a, i) => <li key={i} className="rounded-lg bg-white/[0.04] px-3 py-2">{a}</li>)}
                      {qAnswers.length === 0 && <li className="text-slate-500">No answers yet.</li>}
                    </ul>
                  ) : (
                    <div className="space-y-2">
                      {Object.entries(counts).map(([key, count]) => (
                        <div key={key} className="flex items-center gap-3 text-sm">
                          <span className="w-20 truncate text-slate-400">{key}</span>
                          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/[0.05]">
                            <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500" style={{ width: `${(count / qAnswers.length) * 100}%` }} />
                          </div>
                          <span className="w-6 text-right font-mono text-xs text-slate-400">{count}</span>
                        </div>
                      ))}
                      {qAnswers.length === 0 && <p className="text-sm text-slate-500">No answers yet.</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!deleteId} message="This survey and its responses will be deleted." onCancel={() => setDeleteId(null)} onConfirm={handleDelete} />
    </div>
  );
};

export default Surveys;
