import { useEffect, useState } from 'react';

export default function StarRating({ recipeId, average, count, token }) {
  const [hover, setHover] = useState(0);
  const [my, setMy] = useState(0);
  const [avg, setAvg] = useState(average || 0);
  const [cnt, setCnt] = useState(count || 0);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/recipes/${recipeId}/ratings/me`, { headers: { Authorization: `Bearer ${token}` }})
      .then(r => r.json()).then(d => setMy(d.value || 0)).catch(()=>{});
  }, [recipeId, token]);

  const rate = async (val) => {
    if (!token) return alert('Please login to rate');
    const res = await fetch(`/api/recipes/${recipeId}/ratings`, {
      method: 'POST',
      headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ value: val })
    });
    const data = await res.json();
    setMy(val);
    setAvg(data.averageRating);
    setCnt(data.ratingsCount);
  };

  return (
    <div className="flex items-center gap-2">
      {[1,2,3,4,5].map(n => (
        <button
          key={n}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => rate(n)}
          aria-label={`Rate ${n}`}
          className={`text-xl ${ (hover||my) >= n ? 'text-yellow-500' : 'text-gray-300' }`}
        >★</button>
      ))}
      <span className="text-sm text-gray-600">{avg.toFixed(1)} ({cnt})</span>
    </div>
  );
}
