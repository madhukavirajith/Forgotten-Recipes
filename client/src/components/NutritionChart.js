import React from 'react';

export default function NutritionChart({ selectedRecipe }) {
  const getNutritionChartImage = (recipeName) => {
    const normalized = recipeName.toLowerCase().replace(/\s/g, '');
    return `/${normalized}nutri.png`; 
  };

  return (
    <div className="nutritionChart">
      <h3>Nutritional Comparison Charts</h3>
      
      <img
        src={getNutritionChartImage(selectedRecipe)}
        alt="Nutrition Chart"
        className="chartImage"
        style={{ width: '100%', borderRadius: '8px', marginBottom: '1rem' }}
      />

      <p>
        <span style={{ color: 'gray' }}>■</span> Original Recipe &nbsp;&nbsp;
        <span style={{ color: 'black' }}>■</span> Twisted Recipe
      </p>
    </div>
  );
}
