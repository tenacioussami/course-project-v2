import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Send, Trash2, MessagesSquare } from 'lucide-react';
import api, { errMsg } from '../services/api';
import { useQuery, setQueryData, invalidate } from '../lib/query';
import { toast } from '../components/Toast';
import { PageHeader, Avatar } from '../components/ui';
import { Skeleton } from '../components/Loading';
import { useAuth } from '../context/AuthContext';

const dayLabel = (d) => {
  const date = new Date(d);
  const today = new Date();
  const y = new Date(); y.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === y.toDateString()) return 'Yesterday';
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
};

const Messages = () => {
  const { user, isAdmin } = useAuth();
  // light polling for a "live" feel — pauses automatically when the tab is hidden
  const { data: messages, loading } = useQuery('/messages', null, { refetchInterval: 6000 });
  const [text, setText] = useState('');
  const listRef = useRef(null);
  const count = messages?.length || 0;

  // Scroll only the chat box (not the whole page) to the newest message
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [count]);

  const handleSend = async (e) => {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setText('');
    // Optimistic: show my message immediately
    const temp = { _id: `tmp-${Date.now()}`, message: body, createdAt: new Date().toISOString(), sender: { _id: user._id, name: user.name }, pending: true };
    setQueryData('/messages', null, (list = []) => [...list, temp]);
    try {
      const res = await api.post('/messages', { message: body });
      setQueryData('/messages', null, (list = []) => list.map((m) => (m._id === temp._id ? res.data : m)));
    } catch (err) {
      setQueryData('/messages', null, (list = []) => list.filter((m) => m._id !== temp._id));
      setText(body);
      toast.error(errMsg(err, 'Message not sent'));
    }
    invalidate('/dashboard');
  };

  const handleDelete = async (id) => {
    setQueryData('/messages', null, (list = []) => list.filter((m) => m._id !== id));
    try {
      await api.delete(`/messages/${id}`);
    } catch (err) {
      toast.error(errMsg(err, 'Delete failed'));
      invalidate('/messages');
    }
  };

  let lastDay = '';

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow="Team channel" title="Project chat" subtitle="Quick updates, questions and wins." />
      <div className="card flex h-[65vh] min-h-[420px] flex-col overflow-hidden">
        <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto p-4 sm:p-6">
          {loading && [0, 1, 2, 3].map((i) => (
            <div key={i} className={`flex ${i % 2 ? 'justify-end' : ''}`}><Skeleton className="h-12 w-56 rounded-2xl" /></div>
          ))}
          {!loading && count === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <MessagesSquare size={32} className="mb-3 text-slate-600" />
              <p className="text-sm text-slate-500">No messages yet. Say hello!</p>
            </div>
          )}
          {messages?.map((m) => {
            const mine = user && m.sender?._id === user._id;
            const day = dayLabel(m.createdAt);
            const showDay = day !== lastDay;
            lastDay = day;
            return (
              <div key={m._id}>
                {showDay && (
                  <div className="my-4 flex items-center gap-3">
                    <span className="h-px flex-1 bg-white/[0.06]" />
                    <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">{day}</span>
                    <span className="h-px flex-1 bg-white/[0.06]" />
                  </div>
                )}
                <div className={`flex items-end gap-2 ${mine ? 'justify-end' : 'justify-start'}`}>
                  {!mine && <Avatar name={m.sender?.name} src={m.sender?.profileImage} size={28} />}
                  <div
                    className={`group max-w-[78%] rounded-2xl px-4 py-2.5 text-sm transition ${
                      mine
                        ? 'rounded-br-md bg-gradient-to-br from-cyan-400 to-violet-500 text-ink-950'
                        : 'rounded-bl-md bg-white/[0.06] text-slate-200'
                    } ${m.pending ? 'opacity-60' : ''}`}
                  >
                    {!mine && <p className="mb-0.5 text-xs font-bold text-cyan-300">{m.sender?.name}</p>}
                    <p className="whitespace-pre-wrap break-words">{m.message}</p>
                    <div className="mt-1 flex items-center justify-end gap-2">
                      <span className={`font-mono text-[10px] ${mine ? 'text-ink-950/60' : 'text-slate-500'}`}>
                        {m.pending ? 'sending…' : new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {(mine || isAdmin) && !m.pending && (
                        <button onClick={() => handleDelete(m._id)} className={`opacity-0 transition group-hover:opacity-100 ${mine ? 'text-ink-950/60' : 'text-slate-500'} hover:text-rose-500`} aria-label="Delete message">
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {user ? (
          <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-white/[0.06] bg-white/[0.02] p-3">
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a message…" className="input rounded-full" />
            <button className="btn-primary h-11 w-11 shrink-0 rounded-full p-0" aria-label="Send" disabled={!text.trim()}>
              <Send size={17} />
            </button>
          </form>
        ) : (
          <p className="border-t border-white/[0.06] p-4 text-center text-sm text-slate-500">
            <Link to="/login" className="font-semibold text-cyan-300 hover:underline">Log in</Link> to send a message.
          </p>
        )}
      </div>
    </div>
  );
};

export default Messages;
