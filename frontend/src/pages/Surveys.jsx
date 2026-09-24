import { useEffect, useState } from 'react';
import { Plus, Trash2, BarChart3, X } from 'lucide-react';
import api from '../services/api';
import Loading from '../components/Loading';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { useAuth } from '../context/AuthContext';

const emptyQuestion = () => ({ tempId: crypto.randomUUID(), questionText: '', type: 'short_answer', options: [''] });

const Surveys = () => {
  const { isAdmin, user } = useAuth();
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [takeSurvey, setTakeSurvey] = useState(null);
  const [answers, setAnswers] = useState({});
  const [resultsSurvey, setResultsSurvey] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', questions: [emptyQuestion()] });

  const load = async () => {
    setLoading(true);
    const res = await api.get('/surveys');
    setSurveys(res.data);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const addQuestion = () => setForm({ ...form, questions: [...form.questions, emptyQuestion()] });
  const removeQuestion = (id) => setForm({ ...form, questions: form.questions.filter((q) => q.tempId !== id) });
  const updateQuestion = (id, updates) => setForm({
    ...form,
    questions: form.questions.map((q) => (q.tempId === id ? { ...q, ...updates } : q)),
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    await api.post('/surveys', {
      title: form.title,
      description: form.description,
      questions: form.questions.map(({ tempId, ...q }) => q),
    });
    setForm({ title: '', description: '', questions: [emptyQuestion()] });
    setCreateOpen(false);
    load();
  };

  const openTake = (survey) => {
    setTakeSurvey(survey);
    setAnswers({});
  };

  const submitResponse = async (e) => {
    e.preventDefault();
    const payload = {
      answers: Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer })),
    };
    await api.post(`/surveys/${takeSurvey._id}/responses`, payload);
    setTakeSurvey(null);
  };

  const openResults = async (survey) => {
    const res = await api.get(`/surveys/${survey._id}/results`);
    setResultsSurvey(res.data);
  };

  const handleDelete = async () => {
    await api.delete(`/surveys/${deleteId}`);
    setDeleteId(null);
    load();
  };

  if (loading) return <Loading />;

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Surveys</h1>
        {isAdmin && (
          <button onClick={() => setCreateOpen(true)} className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
            <Plus size={16} /> New Survey
          </button>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {surveys.map((s) => (
          <div key={s._id} className="rounded-xl border bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800">{s.title}</h3>
            <p className="mt-1 text-sm text-gray-500">{s.description}</p>
            <p className="mt-2 text-xs text-gray-400">{s.questions.length} question(s) · by {s.createdBy?.name}</p>
            <div className="mt-4 flex gap-2">
              {user && <button onClick={() => openTake(s)} className="rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-100">Take Survey</button>}
              <button onClick={() => openResults(s)} className="flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200">
                <BarChart3 size={12} /> Results
              </button>
              {isAdmin && <button onClick={() => setDeleteId(s._id)} className="ml-auto text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>}
            </div>
          </div>
        ))}
        {surveys.length === 0 && <p className="text-sm text-gray-400">No surveys yet.</p>}
      </div>

      {/* Create survey modal */}
      <Modal open={createOpen} title="New Survey" onClose={() => setCreateOpen(false)} wide>
        <form onSubmit={handleCreate} className="space-y-4">
          <input required placeholder="Survey title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-lg border px-3 py-2" />
          <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-lg border px-3 py-2" rows={2} />

          <div className="space-y-3">
            {form.questions.map((q, idx) => (
              <div key={q.tempId} className="rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <input required placeholder={`Question ${idx + 1}`} value={q.questionText} onChange={(e) => updateQuestion(q.tempId, { questionText: e.target.value })} className="flex-1 rounded-lg border px-3 py-1.5 text-sm" />
                  <select value={q.type} onChange={(e) => updateQuestion(q.tempId, { type: e.target.value })} className="rounded-lg border px-2 py-1.5 text-sm">
                    <option value="short_answer">Short answer</option>
                    <option value="yes_no">Yes/No</option>
                    <option value="rating">Rating (1-5)</option>
                    <option value="multiple_choice">Multiple choice</option>
                  </select>
                  {form.questions.length > 1 && (
                    <button type="button" onClick={() => removeQuestion(q.tempId)} className="text-gray-400 hover:text-red-500"><X size={16} /></button>
                  )}
                </div>
                {q.type === 'multiple_choice' && (
                  <div className="mt-2 space-y-1">
                    {q.options.map((opt, oi) => (
                      <input key={oi} placeholder={`Option ${oi + 1}`} value={opt} onChange={(e) => {
                        const options = [...q.options]; options[oi] = e.target.value;
                        updateQuestion(q.tempId, { options });
                      }} className="w-full rounded-lg border px-3 py-1 text-sm" />
                    ))}
                    <button type="button" onClick={() => updateQuestion(q.tempId, { options: [...q.options, ''] })} className="text-xs font-medium text-brand-600">+ Add option</button>
                  </div>
                )}
              </div>
            ))}
          </div>
          <button type="button" onClick={addQuestion} className="text-sm font-medium text-brand-600">+ Add question</button>
          <button className="w-full rounded-lg bg-brand-600 py-2 font-medium text-white hover:bg-brand-700">Create Survey</button>
        </form>
      </Modal>

      {/* Take survey modal */}
      <Modal open={!!takeSurvey} title={takeSurvey?.title} onClose={() => setTakeSurvey(null)}>
        {takeSurvey && (
          <form onSubmit={submitResponse} className="space-y-4">
            {takeSurvey.questions.map((q) => (
              <div key={q._id}>
                <label className="mb-1 block text-sm font-medium text-gray-700">{q.questionText}</label>
                {q.type === 'short_answer' && (
                  <input required value={answers[q._id] || ''} onChange={(e) => setAnswers({ ...answers, [q._id]: e.target.value })} className="w-full rounded-lg border px-3 py-2" />
                )}
                {q.type === 'yes_no' && (
                  <select required value={answers[q._id] || ''} onChange={(e) => setAnswers({ ...answers, [q._id]: e.target.value })} className="w-full rounded-lg border px-3 py-2">
                    <option value="">Select...</option><option value="Yes">Yes</option><option value="No">No</option>
                  </select>
                )}
                {q.type === 'rating' && (
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button type="button" key={n} onClick={() => setAnswers({ ...answers, [q._id]: n })}
                        className={`h-9 w-9 rounded-full border text-sm font-medium ${answers[q._id] === n ? 'bg-brand-600 text-white' : 'text-gray-600'}`}>{n}</button>
                    ))}
                  </div>
                )}
                {q.type === 'multiple_choice' && (
                  <div className="space-y-1">
                    {q.options.map((opt) => (
                      <label key={opt} className="flex items-center gap-2 text-sm text-gray-600">
                        <input type="radio" required name={q._id} checked={answers[q._id] === opt} onChange={() => setAnswers({ ...answers, [q._id]: opt })} />
                        {opt}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <button className="w-full rounded-lg bg-brand-600 py-2 font-medium text-white hover:bg-brand-700">Submit Response</button>
          </form>
        )}
      </Modal>

      {/* Results modal */}
      <Modal open={!!resultsSurvey} title={`Results: ${resultsSurvey?.survey?.title || ''}`} onClose={() => setResultsSurvey(null)} wide>
        {resultsSurvey && (
          <div className="space-y-5">
            <p className="text-sm text-gray-500">{resultsSurvey.responses.length} response(s)</p>
            {resultsSurvey.survey.questions.map((q) => {
              const qAnswers = resultsSurvey.responses.map((r) => r.answers.find((a) => a.questionId === q._id)?.answer).filter((a) => a !== undefined);
              const counts = {};
              qAnswers.forEach((a) => { counts[a] = (counts[a] || 0) + 1; });
              return (
                <div key={q._id}>
                  <p className="mb-2 text-sm font-semibold text-gray-700">{q.questionText}</p>
                  {q.type === 'short_answer' ? (
                    <ul className="space-y-1 text-sm text-gray-600">
                      {qAnswers.map((a, i) => <li key={i} className="rounded bg-gray-50 px-2 py-1">{a}</li>)}
                    </ul>
                  ) : (
                    <div className="space-y-1">
                      {Object.entries(counts).map(([key, count]) => (
                        <div key={key} className="flex items-center gap-2 text-sm">
                          <span className="w-16 text-gray-500">{key}</span>
                          <div className="h-3 flex-1 overflow-hidden rounded-full bg-gray-100">
                            <div className="h-full bg-brand-500" style={{ width: `${(count / qAnswers.length) * 100}%` }} />
                          </div>
                          <span className="w-6 text-right text-gray-400">{count}</span>
                        </div>
                      ))}
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
