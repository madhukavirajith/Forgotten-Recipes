import { useState } from 'react';

export default function FeedbackModal({ recipeId, token, onClose }) {
  const [type, setType] = useState('content');
  const [message, setMessage] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!token) return alert('Login to send feedback');
    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ recipeId, type, message })
    });
    onClose();
    alert('Thanks! Your feedback was sent to the admins.');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
      <form onSubmit={submit} className="bg-white rounded-xl w-full max-w-lg p-4 space-y-3">
        <h3 className="text-lg font-semibold">Send Feedback</h3>
        <select className="border rounded p-2 w-full" value={type} onChange={e=>setType(e.target.value)}>
          <option value="content">Content issue</option>
          <option value="abuse">Abuse / report</option>
          <option value="bug">Bug</option>
          <option value="other">Other</option>
        </select>
        <textarea className="border rounded p-2 w-full min-h-[120px]" value={message} onChange={e=>setMessage(e.target.value)} placeholder="Describe the issue…"/>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-3 py-2 rounded border">Cancel</button>
          <button className="px-4 py-2 rounded bg-brown-700 text-white">Send</button>
        </div>
      </form>
    </div>
  );
}
