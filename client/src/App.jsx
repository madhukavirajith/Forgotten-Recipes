
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

import Navbar from './components/Navbar';
import Home from './components/Home';
import LoginRegisterForm from './components/LoginRegisterForm';
import About from './components/About';
import Recipes from './components/Recipes';
import RecipeDetail from './components/RecipeDetail';
import CookMode from './components/CookMode';
import CalendarPage from './components/Calendar';
import Blog from './components/Blog';
import AdminDashboard from './components/dashboards/AdminDashboard';
import HeadChefDashboard from './components/dashboards/HeadChefDashboard';
import DieticianDashboard from './components/dashboards/DieticianDashboard';
import VisitorDashboard from './components/dashboards/VisitorDashboard';
import Footer from './components/Footer';
import Stories from './components/Stories';
import Chat from './components/Chat';
import MeasurementConverter from './components/MeasurementConverter';
import TwistTool from './components/TwistTool';

function App() {
  return (
    <Router>
      <div className="app">
        <Navbar />

        <main className="main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LoginRegisterForm />} />
            <Route path="/about" element={<About />} />

            
            <Route path="/recipes" element={<Recipes />} />
            <Route path="/recipes/:id" element={<RecipeDetail />} />
            <Route path="/recipes/:id/cook" element={<CookMode />} />

            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/headchef" element={<HeadChefDashboard />} />
            <Route path="/dietician" element={<DieticianDashboard />} />
            <Route path="/visitor" element={<VisitorDashboard />} />
            <Route path="/stories" element={<Stories />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/convert" element={<MeasurementConverter />} />
            <Route path="/twist-tool" element={<TwistTool />} />

            
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
}

export default App;
