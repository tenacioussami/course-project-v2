import { useEffect, useRef, useState } from 'react';
import { Send, Trash2 } from 'lucide-react';
import api from '../services/api';
import Loading from '../components/Loading';
import { useAuth } from '../context/AuthContext';

const Messages = () => {
  const { user, isAdmin } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  const load = async () => {
    const res = await api.get('/messages');
    setMessages(res.data);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 8000); // light polling for "live" feel
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    await api.post('/messages', { message: text });
    setText('');
    load();
  };

  const handleDelete = async (id) => {
    await api.delete(`/messages/${id}`);
    load();
  };

  if (loading) return <Loading />;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-2xl font-bold">Project Chat</h1>
      <div className="flex h-[60vh] flex-col rounded-xl border bg-white shadow-sm">
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.length === 0 && <p className="text-center text-sm text-gray-400">No messages yet. Say hello!</p>}
          {messages.map((m) => {
            const mine = user && m.sender?._id === user._id;
            return (
              <div key={m._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`group max-w-xs rounded-2xl px-4 py-2 text-sm ${mine ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                  {!mine && <p className="mb-0.5 text-xs font-semibold text-brand-600">{m.sender?.name}</p>}
                  <p>{m.message}</p>
                  <div className="mt-1 flex items-center justify-between gap-3">
                    <span className={`text-[10px] ${mine ? 'text-brand-100' : 'text-gray-400'}`}>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {(mine || isAdmin) && (
                      <button onClick={() => handleDelete(m._id)} className={`opacity-0 group-hover:opacity-100 ${mine ? 'text-brand-100' : 'text-gray-400'} hover:text-red-500`}>
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
        {user ? (
          <form onSubmit={handleSend} className="flex items-center gap-2 border-t p-3">
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message..." className="flex-1 rounded-full border px-4 py-2 text-sm outline-none focus:border-brand-500" />
            <button className="rounded-full bg-brand-600 p-2.5 text-white hover:bg-brand-700"><Send size={16} /></button>
          </form>
        ) : (
          <p className="border-t p-3 text-center text-sm text-gray-400">Login to send a message.</p>
        )}
      </div>
    </div>
  );
};

export default Messages;
