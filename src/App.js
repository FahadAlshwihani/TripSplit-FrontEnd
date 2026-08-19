// src/App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import TripDetailsPage from './pages/TripDetailsPage';
import NotFoundPage from './pages/NotFoundPage';
import About from './pages/About';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './styles/App.css';
import './styles/Header.css';
import './styles/Footer.css';
import './i18n'; // Import i18n configuration
import LanguageProvider from './components/LanguageProvider';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import InvitationPage from './pages/InvitationPage';
import JoinRequestPage from './pages/JoinRequestPage';
import { AuthProvider } from './auth/AuthContext';

const App = () => {
  const [trip, setTrip] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [budget, setBudget] = useState(0);

  return (
    <LanguageProvider><AuthProvider>
      <div className="app-container">
        <div className="area">
          <ul className="circles">
            {[...Array(10)].map((_, i) => <li key={i}></li>)}
          </ul>
        </div>
        <Router>
         
          <Routes>
            <Route path="/" element={<HomePage setTrip={setTrip} />} />
            <Route
              path="/trip/:code"
              element={
                <TripDetailsPage
                  trip={trip}
                  setTrip={setTrip}
                  expenses={expenses}
                  setExpenses={setExpenses}
                  budget={budget}
                  setBudget={setBudget}
                />
              }
            />
            <Route path="/about" element={<About />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/invite/:token" element={<InvitationPage />} />
            <Route path="/join-request/:requestId" element={<JoinRequestPage />} />
            <Route path="/not-found" element={<NotFoundPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Router>
      </div>
    </AuthProvider></LanguageProvider>
  );
};

export default App;
