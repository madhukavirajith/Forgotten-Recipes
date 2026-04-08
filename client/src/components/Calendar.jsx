import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './CalendarPage.css';

const festiveEvents = {
  '2025-01-14': {
    festival: 'Thai Pongal',
    recipes: ['Pongal', 'Sweet Potatoes'],
  },
  '2025-02-04': {
    festival: 'Independence Day',
    recipes: ['Kiribath', 'Lunu Miris', 'Seeni Sambol'],
  },
  '2025-03-06': {
    festival: 'Maha Shivaratri',
    recipes: ['Vadai', 'Payasam'],
  },
  '2025-04-14': {
    festival: 'Sinhala & Tamil Avurudu',
    recipes: ['Kiribath', 'Kokis', 'Kavum', 'Athirasa'],
  },
  '2025-05-22': {
    festival: 'Vesak Poya',
    recipes: ['Plantain Leaf Meals', 'Sweet Mango Curry'],
  },
  '2025-06-20': {
    festival: 'Poson Poya',
    recipes: ['Boiled Jackfruit', 'Gotukola Sambol'],
  },
  '2025-07-11': {
    festival: 'Esala Perahera Season',
    recipes: ['Milk Rice', 'Banana Pancakes'],
  },
  '2025-08-01': {
    festival: 'Harvest Celebration',
    recipes: ['Boiled Manioc', 'Coconut Sambol'],
  },
  '2025-10-17': {
    festival: 'Vap Poya',
    recipes: ['Pumpkin Curry', 'Gotukola Sambol'],
  },
  '2025-11-01': {
    festival: 'Deepavali',
    recipes: ['Rava Laddu', 'Murukku', 'Gulab Jamun'],
  },
  '2025-12-25': {
    festival: 'Christmas',
    recipes: ['Breudher', 'Fruit Cake', 'Love Cake'],
  }
};


const formatDate = (date) => date.toISOString().split('T')[0];

const CalendarPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const formatted = formatDate(selectedDate);
  const event = festiveEvents[formatted];

  return (
    <div className="calendar-page-container">
      <h1>Festive Recipe Calendar</h1>
      <p className="calendar-subtitle">
        Click on a date to explore festivals and traditional Sri Lankan recipes.
      </p>

      <div className="calendar-wrapper">
        <Calendar
          onChange={setSelectedDate}
          value={selectedDate}
          tileClassName={({ date }) =>
            festiveEvents[formatDate(date)] ? 'highlight' : null
          }
        />
      </div>

      <div className="calendar-event-details">
        <h2>Selected Date: {selectedDate.toDateString()}</h2>
        {event ? (
          <>
            <h3>{event.festival}</h3>
            <ul>
              {event.recipes.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </>
        ) : (
          <p>No events for this date.</p>
        )}
      </div>
    </div>
  );
};

export default CalendarPage;
