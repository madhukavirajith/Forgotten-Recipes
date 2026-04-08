
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Recipes.css';
import RecipeCard from './RecipeCard';

const API = process.env.REACT_APP_API_URL || '';

const Recipes = () => {
  const [recipes, setRecipes] = useState([]);
  const [filtered, setFiltered] = useState([]);

  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState(['All']);
  const [spiceLevels, setSpiceLevels] = useState(['All']);
  const [dietTypes, setDietTypes] = useState(['All']);

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSpice, setSelectedSpice] = useState('All');
  const [selectedDiet, setSelectedDiet] = useState('All');

  useEffect(() => {
    axios.get(`${API}/api/recipes`).then((res) => {
      const data = Array.isArray(res.data) ? res.data : [];
      const approved = data.filter(r => r.status === 'approved' || r.approved === true);

      setRecipes(approved);
      setFiltered(approved);

      const uniq = (arr, key) =>
        ['All', ...Array.from(new Set(arr.map(i => i[key]).filter(Boolean)))];

      setCategories(uniq(approved, 'category'));
      setSpiceLevels(uniq(approved, 'spiceLevel'));
      setDietTypes(uniq(approved, 'dietType'));
    })
    .catch(err => console.error('Error fetching recipes:', err?.response?.data || err.message));
  }, []);

  useEffect(() => {
    let results = [...recipes];
    if (selectedCategory !== 'All') results = results.filter(r => r.category === selectedCategory);
    if (selectedSpice !== 'All')    results = results.filter(r => r.spiceLevel === selectedSpice);
    if (selectedDiet !== 'All')     results = results.filter(r => r.dietType === selectedDiet);

    if (search.trim()) {
      const q = search.toLowerCase();
      results = results.filter(r =>
        r.name?.toLowerCase().includes(q) ||
        r.ingredients?.toLowerCase().includes(q) ||
        r.culture?.toLowerCase().includes(q)
      );
    }
    setFiltered(results);
  }, [search, selectedCategory, selectedSpice, selectedDiet, recipes]);

  return (
    <div className="recipes-container">
      <h2>Explore Traditional Recipes</h2>

      <div className="filter-bar">
        <input
          type="text"
          placeholder="Search recipes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={selectedSpice} onChange={(e) => setSelectedSpice(e.target.value)}>
          {spiceLevels.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={selectedDiet} onChange={(e) => setSelectedDiet(e.target.value)}>
          {dietTypes.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p>No matching recipes found.</p>
      ) : (
        <div className="recipe-grid">
          {filtered.map((r) => (
            <RecipeCard key={r._id} recipe={r} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Recipes;
