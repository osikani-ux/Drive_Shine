import { useEffect, useState } from 'react';
import { onSnapshot, orderBy, query, Timestamp } from 'firebase/firestore';
import { Mail } from 'lucide-react';
import { contactMessagesRef, firestore, requireFirebase } from '../firebase';

interface ContactMessage {
  id: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  createdAt: Timestamp;
}

function parseContactMessage(id: string, data: Record<string, unknown>): ContactMessage | null {
  if (
    typeof data.name !== 'string'
    || typeof data.phone !== 'string'
    || typeof data.email !== 'string'
    || typeof data.message !== 'string'
    || !(data.createdAt instanceof Timestamp)
  ) return null;

  return { id, name: data.name, phone: data.phone, email: data.email, message: data.message, createdAt: data.createdAt };
}

export default function ContactMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const messagesRef = requireFirebase(contactMessagesRef, 'Firestore contact messages');
    const messagesQuery = query(
      messagesRef,
      orderBy('createdAt', 'desc'),
    );

    return onSnapshot(messagesQuery, snapshot => {
      setMessages(snapshot.docs
        .map(item => parseContactMessage(item.id, item.data()))
        .filter((message): message is ContactMessage => message !== null));
      setLoading(false);
      setError('');
    }, listenerError => {
      console.error('Firebase contact messages listener failed:', listenerError);
      setError('Contact messages could not be loaded. Check Firestore rules and try again.');
      setLoading(false);
    });
  }, []);

  if (!firestore) {
    return <p className="text-sm text-red-600" role="alert">Firebase Firestore is not configured.</p>;
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{messages.length} message{messages.length === 1 ? '' : 's'}</p>
      </div>

      {error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
      {loading ? (
        <p className="p-8 text-center text-slate-500" role="status">Loading messages…</p>
      ) : messages.length === 0 ? (
        <div className="rounded-xl border border-slate-100 bg-white p-10 text-center text-slate-500">
          <Mail className="mx-auto mb-3 text-slate-400" size={28} />
          No contact messages yet
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map(message => (
            <article key={message.id} className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-800">{message.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    <a className="hover:text-amber-700" href={`mailto:${message.email}`}>{message.email}</a>
                    {' · '}
                    <a className="hover:text-amber-700" href={`tel:${message.phone}`}>{message.phone}</a>
                  </p>
                </div>
                <time className="text-xs text-slate-500" dateTime={message.createdAt.toDate().toISOString()}>
                  {message.createdAt.toDate().toLocaleString()}
                </time>
              </div>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">{message.message}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
