import { useEffect, useState } from 'react';

export default function CommentsModal({ recipeId, token, onClose }) {
  const [items, setItems] = useState([]);
  const [text, setText] = useState('');

  const load = async () => {
    const res = await fetch(`/api/recipes/${recipeId}/comments?limit=20`);
    setItems(await res.json());
  };
  useEffect(() => { load(); }, [recipeId]);

  const submit = async (e) => {
    e.preventDefault();
    if (!token) return alert('Login to comment');
    const res = await fetch(`/api/recipes/${recipeId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ text })
    });
    const newItem = await res.json();
    setItems([newItem, ...items]);
    setText('');
  };

  const remove = async (id) => {
    if (!token) return;
    await fetch(`/api/recipes/${recipeId}/comments/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    setItems(items.filter(c => c._id !== id));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Comments</h3>
          <button onClick={onClose} className="px-2 py-1 rounded">✕</button>
        </div>

        <form onSubmit={submit} className="flex gap-2">
          <input value={text} onChange={e=>setText(e.target.value)}
                 placeholder="Write a comment…" className="flex-1 border rounded px-3 py-2" />
          <button className="bg-brown-700 text-white rounded px-4 py-2">Post</button>
        </form>

        <ul className="space-y-3 max-h-96 overflow-auto">
          {items.map(c => (
            <li key={c._id} className="border rounded p-3">
              <div className="text-sm text-gray-600">{c.user?.name} • {new Date(c.createdAt).toLocaleString()}</div>
              <div className="mt-1">{c.text}</div>
              <button onClick={()=>remove(c._id)} className="text-xs text-red-500 mt-2">Delete</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
