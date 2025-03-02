import React from 'react';
import './App.css';
import ScreeningTimes from './components/ScreeningTimes';

const App = () => {
  return (
    <div className="App">
      <h1>Movie Ticket Booking</h1>
      <ScreeningTimes />
    </div>
  );
};

export default App;