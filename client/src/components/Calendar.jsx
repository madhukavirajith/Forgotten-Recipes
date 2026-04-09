import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './CalendarPage.css';

// Expanded festive events data for 2026 with more details
const festiveEvents = {
  '2026-01-14': {
    festival: 'Thai Pongal',
    category: 'Harvest Festival',
    description: 'A traditional harvest festival celebrated by Tamils to thank the Sun God for a bountiful harvest.',
    recipes: ['Pongal (Sweet & Savory)', 'Sweet Potatoes', 'Sugarcane', 'Turmeric Rice'],
    traditions: ['Cooking Pongal in clay pots', 'Kolam decorations', 'Visiting temples'],
    emoji: '🌾'
  },
  '2026-02-04': {
    festival: 'Independence Day',
    category: 'National Holiday',
    description: 'Celebrating Sri Lanka\'s independence from British rule in 1948.',
    recipes: ['Kiribath (Milk Rice)', 'Lunu Miris (Onion Sambol)', 'Seeni Sambol (Sweet Onion Sambol)', 'Fish Curry'],
    traditions: ['Flag hoisting ceremonies', 'Parades', 'Fireworks', 'Cultural performances'],
    emoji: '🇱🇰'
  },
  '2026-03-06': {
    festival: 'Maha Shivaratri',
    category: 'Religious Festival',
    description: 'The Great Night of Shiva, dedicated to Lord Shiva with night-long prayers.',
    recipes: ['Vadai (Lentil Fritters)', 'Payasam (Milk Pudding)', 'Fruit Offerings', 'Panakam (Jaggery Drink)'],
    traditions: ['All-night vigil', 'Temple visits', 'Fasting', 'Bilva leaf offerings'],
    emoji: '🕉️'
  },
  '2026-04-14': {
    festival: 'Sinhala & Tamil New Year',
    category: 'Cultural Festival',
    description: 'The most important traditional festival celebrating the sun\'s movement from Pisces to Aries.',
    recipes: ['Kiribath (Milk Rice)', 'Kokis (Crispy Cookies)', 'Kavum (Oil Cakes)', 'Athirasa (Sweet Patties)', 'Aluwa (Sweet Diamond Cuts)'],
    traditions: ['Auspicious times (Neketh)', 'Lighting the hearth', 'Exchange of coins', 'Playing traditional games'],
    emoji: '🎉'
  },
  '2026-05-01': {
    festival: 'May Day',
    category: 'National Holiday',
    description: 'International Workers\' Day celebrating labor rights and workers\' contributions.',
    recipes: ['Simple Rice and Curry', 'String Hoppers', 'Pol Sambol (Coconut Sambol)'],
    traditions: ['Parades', 'Rallies', 'Community gatherings'],
    emoji: '👷'
  },
  '2026-05-22': {
    festival: 'Vesak Poya',
    category: 'Religious Festival',
    description: 'The most sacred Buddhist festival celebrating the birth, enlightenment, and passing away of Lord Buddha.',
    recipes: ['Dansal (Free Food Stalls)', 'Plantain Leaf Meals', 'Sweet Mango Curry', 'Rice Porridge'],
    traditions: ['Buddhist sermons', 'Lighting lanterns', 'Decorating streets', 'Acts of generosity'],
    emoji: '🏮'
  },
  '2026-06-20': {
    festival: 'Poson Poya',
    category: 'Religious Festival',
    description: 'Commemorates the introduction of Buddhism to Sri Lanka by Arahant Mahinda in 247 BC.',
    recipes: ['Boiled Jackfruit', 'Gotukola Sambol (Pennywort Salad)', 'Milk Rice', 'Herbal Porridge'],
    traditions: ['Pilgrimages to Mihintale', 'Buddhist processions', 'Religious observances'],
    emoji: '📿'
  },
  '2026-07-11': {
    festival: 'Esala Perahera Season',
    category: 'Cultural Festival',
    description: 'The grandest Buddhist procession in Kandy, honoring the Sacred Tooth Relic of Lord Buddha.',
    recipes: ['Milk Rice', 'Banana Pancakes', 'Traditional Sweets', 'Coconut Roti'],
    traditions: ['Majestic elephant parade', 'Drummers and dancers', 'Fire-dancing', 'Whip-crackers'],
    emoji: '🐘'
  },
  '2026-08-01': {
    festival: 'Harvest Celebration',
    category: 'Agricultural Festival',
    description: 'Celebrating the Yala harvest season across rural Sri Lanka.',
    recipes: ['Boiled Manioc (Cassava)', 'Coconut Sambol', 'Fresh Vegetable Curry', 'Jaggery with Coconut'],
    traditions: ['Harvest rituals', 'Offerings to the sun', 'Community feasts', 'Folk singing'],
    emoji: '🌽'
  },
  '2026-10-17': {
    festival: 'Vap Poya',
    category: 'Religious Festival',
    description: 'Marks the beginning of the rice-growing season and rains retreat for Buddhist monks.',
    recipes: ['Pumpkin Curry', 'Gotukola Sambol', 'Green Gram Curry', 'Herbal Rice'],
    traditions: ['Plowing ceremonies', 'Offerings to monks', 'Observing Sil', 'Meditation retreats'],
    emoji: '🌧️'
  },
  '2026-11-01': {
    festival: 'Deepavali',
    category: 'Religious Festival',
    description: 'The Festival of Lights celebrating the victory of light over darkness and good over evil.',
    recipes: ['Rava Laddu (Semolina Balls)', 'Murukku (Chickpea Snacks)', 'Gulab Jamun (Milk Dumplings)', 'Thosai', 'Vadai'],
    traditions: ['Lighting oil lamps', 'Fireworks', 'New clothes', 'Rangoli decorations'],
    emoji: '🪔'
  },
  '2026-12-25': {
    festival: 'Christmas',
    category: 'Religious Festival',
    description: 'Celebrating the birth of Jesus Christ with joy, family gatherings, and festive meals.',
    recipes: ['Breudher (Dutch Christmas Cake)', 'Fruit Cake', 'Love Cake', 'Roast Chicken', 'Christmas Pudding'],
    traditions: ['Midnight mass', 'Gift exchange', 'Christmas carols', 'Decorating trees'],
    emoji: '🎄'
  }
};

// Poya (Full Moon) days for 2026
const poyaDays2026 = [
  '2026-01-03', // Duruthu Poya
  '2026-02-01', // Navam Poya
  '2026-03-03', // Medin Poya
  '2026-04-01', // Bak Poya
  '2026-05-01', // Vesak Poya (already in festivals)
  '2026-05-31', // Poson Poya (already in festivals)
  '2026-06-29', // Poson Poya continuation
  '2026-07-29', // Esala Poya
  '2026-08-27', // Nikini Poya
  '2026-09-26', // Binara Poya
  '2026-10-25', // Vap Poya (already in festivals)
  '2026-11-24', // Il Poya
  '2026-12-23'  // Unduvap Poya
];

const formatDate = (date) => date.toISOString().split('T')[0];

const CalendarPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('festival'); // 'festival' or 'recipes'
  const formatted = formatDate(selectedDate);
  const event = festiveEvents[formatted];
  const isPoyaDay = poyaDays2026.includes(formatted);

  // Get current month's events for sidebar
  const currentMonth = selectedDate.getMonth();
  const currentYear = selectedDate.getFullYear();
  const monthEvents = Object.keys(festiveEvents)
    .filter(dateStr => {
      const date = new Date(dateStr);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    })
    .map(dateStr => ({ date: dateStr, ...festiveEvents[dateStr] }));

  // Scroll to top when date changes
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedDate]);

  // Custom tile styling
  const getTileClassName = ({ date }) => {
    const dateStr = formatDate(date);
    if (festiveEvents[dateStr]) return 'festive-highlight';
    if (poyaDays2026.includes(dateStr)) return 'poya-day';
    return null;
  };

  const getTileContent = ({ date }) => {
    const dateStr = formatDate(date);
    const event = festiveEvents[dateStr];
    if (event) {
      return <div className="festive-emoji">{event.emoji}</div>;
    }
    if (poyaDays2026.includes(dateStr)) {
      return <div className="poya-indicator">🌕</div>;
    }
    return null;
  };

  return (
    <div className="calendar-page-container">
      {/* Header Section */}
      <div className="calendar-header">
        <h1>
          <span className="calendar-icon">📅</span>
          Sri Lankan Festive Recipe Calendar 2026
        </h1>
        <p className="calendar-subtitle">
          Discover Sri Lanka's rich cultural heritage through festivals and traditional cuisine
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="calendar-main-grid">
        {/* Left Column - Calendar */}
        <div className="calendar-left">
          <div className="calendar-wrapper">
            <Calendar
              onChange={setSelectedDate}
              value={selectedDate}
              tileClassName={getTileClassName}
              tileContent={getTileContent}
            />
          </div>

          {/* Legend */}
          <div className="calendar-legend">
            <div className="legend-item">
              <span className="legend-color festival-color"></span>
              <span>Festival Day</span>
            </div>
            <div className="legend-item">
              <span className="legend-color poya-color"></span>
              <span>Poya (Full Moon) Day</span>
            </div>
          </div>

          {/* View Toggle */}
          <div className="view-toggle">
            <button 
              className={`toggle-btn ${viewMode === 'festival' ? 'active' : ''}`}
              onClick={() => setViewMode('festival')}
            >
              🎊 Festival Details
            </button>
            <button 
              className={`toggle-btn ${viewMode === 'recipes' ? 'active' : ''}`}
              onClick={() => setViewMode('recipes')}
            >
              🍳 Traditional Recipes
            </button>
          </div>
        </div>

        {/* Right Column - Event Details */}
        <div className="calendar-right">
          <div className="selected-date-header">
            <h2>
              <span className="date-icon">📆</span>
              {selectedDate.toDateString()}
            </h2>
            {isPoyaDay && !event && (
              <div className="poya-badge">
                🌕 Poya Day
              </div>
            )}
          </div>

          {event ? (
            <div className="event-details-card">
              <div className="event-header">
                <div className="event-emoji">{event.emoji}</div>
                <div className="event-title">
                  <h3>{event.festival}</h3>
                  <span className="event-category">{event.category}</span>
                </div>
              </div>

              <div className="event-description">
                <p>{event.description}</p>
              </div>

              {viewMode === 'festival' ? (
                <>
                  <div className="event-section">
                    <h4>
                      <span className="section-icon">📖</span>
                      Traditions & Customs
                    </h4>
                    <ul className="event-list">
                      {event.traditions.map((tradition, i) => (
                        <li key={i}>
                          <span className="list-icon">✨</span>
                          {tradition}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="event-section">
                    <h4>
                      <span className="section-icon">🍽️</span>
                      Traditional Foods
                    </h4>
                    <div className="recipe-tags">
                      {event.recipes.map((recipe, i) => (
                        <span key={i} className="recipe-tag">{recipe}</span>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="event-section">
                  <h4>
                    <span className="section-icon">👩‍🍳</span>
                    Recipes to Try
                  </h4>
                  <div className="recipes-grid">
                    {event.recipes.map((recipe, i) => (
                      <div key={i} className="recipe-card-mini">
                        <div className="recipe-icon">🍲</div>
                        <div className="recipe-name">{recipe}</div>
                        <button className="view-recipe-btn">View Recipe →</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : isPoyaDay ? (
            <div className="poya-details-card">
              <div className="poya-header">
                <div className="poya-emoji">🌕</div>
                <h3>Poya Day</h3>
              </div>
              <p>
                A sacred full moon day observed by Buddhists in Sri Lanka. 
                Many people visit temples, observe religious practices, and refrain from alcohol and meat.
              </p>
              <div className="poya-traditions">
                <h4>Common Practices:</h4>
                <ul>
                  <li>Visiting temples for worship</li>
                  <li>Observing Sil (Buddhist precepts)</li>
                  <li>Meditation and chanting</li>
                  <li>Acts of generosity (Dansal)</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="no-event-card">
              <div className="no-event-emoji">📅</div>
              <h3>No Festival on This Date</h3>
              <p>
                This date doesn't have any major Sri Lankan festivals.
                Check the calendar for highlighted dates to explore our rich cultural celebrations!
              </p>
              <div className="suggestion-box">
                <h4>💡 Nearby Festivals</h4>
                {monthEvents.length > 0 ? (
                  <ul>
                    {monthEvents.slice(0, 3).map((ev, i) => (
                      <li key={i}>
                        <strong>{ev.festival}</strong> - {new Date(ev.date).toDateString()}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>Try selecting a different month to see festivals!</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Festivals Section */}
      <div className="upcoming-section">
        <h3>
          <span className="section-icon">⭐</span>
          Upcoming Festivals This Month
        </h3>
        <div className="upcoming-grid">
          {monthEvents.length > 0 ? (
            monthEvents.map((event, i) => (
              <div 
                key={i} 
                className="upcoming-card"
                onClick={() => setSelectedDate(new Date(event.date))}
              >
                <div className="upcoming-emoji">{event.emoji}</div>
                <div className="upcoming-info">
                  <div className="upcoming-date">
                    {new Date(event.date).toDateString()}
                  </div>
                  <div className="upcoming-festival">{event.festival}</div>
                  <div className="upcoming-category">{event.category}</div>
                </div>
              </div>
            ))
          ) : (
            <p className="no-upcoming">No festivals this month. Check other months!</p>
          )}
        </div>
      </div>

      {/* Fun Fact Section */}
      <div className="fun-fact-section">
        <div className="fun-fact-content">
          <span className="fun-fact-icon">📖</span>
          <div>
            <h4>Did You Know?</h4>
            <p>
              Sri Lanka has 13 Poya (full moon) holidays each year - one for every month! 
              Each Poya day commemorates an important event in Buddhist history, and in 2026,
              Vesak Poya (May 1st) and Poson Poya (May 31st) both fall in the same month!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;