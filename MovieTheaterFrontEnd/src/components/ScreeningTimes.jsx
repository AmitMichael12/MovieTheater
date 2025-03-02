import { useState, useEffect } from 'react';
import api from '../services/api';

const ScreeningTimes = () => {
  const [screeningTimes, setScreeningTimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedScreening, setSelectedScreening] = useState(null);
  const [availableSeats, setAvailableSeats] = useState([]);
  const [chosenSeats, setChosenSeats] = useState([]);
  const [reservationConfirmed, setReservationConfirmed] = useState(false); // To track reservation status

  useEffect(() => {
    const fetchScreeningTimes = async () => {
      try {
        const response = await api.get('/screening-times');
        setScreeningTimes(response.data.screeningTimes);
        setLoading(false);
      } catch (error) {
        setError('Failed to load screening times.');
        setLoading(false);
      }
    };

    fetchScreeningTimes();
  }, []);

  // Function to handle screening click
  const handleScreeningClick = async (screeningTime) => {
    try {
      const response = await api.get(`/seats/${screeningTime}`, { withCredentials: true });
      setSelectedScreening(screeningTime);
      setAvailableSeats(response.data.availableSeats);
      setChosenSeats([]);
      setReservationConfirmed(false); // Reset reservation status
    } catch (error) {
      setError('Failed to load available seats.');
    }
  };

  // Function to handle seat selection
  const handleSeatSelection = (seat) => {
    if (chosenSeats.includes(seat)) {
      setChosenSeats(chosenSeats.filter(s => s !== seat));
    } else {
      if (chosenSeats.length < 4) {
        setChosenSeats([...chosenSeats, seat]);
      } else {
        alert('You can only select up to 4 seats.');
      }
    }
  };

  // Function to handle reservation
  const handleReservation = async () => {
    try {
      const response = await api.post(`/reserve/${selectedScreening}`, { seats: chosenSeats }, { withCredentials: true });
      if (response.data.message) {
        alert('Seats reserved successfully!');
        setReservationConfirmed(true);
      }
    } catch (error) {
      alert('Error reserving seats: ' + error.response?.data || error.message);
    }
  };

  // Function to handle reservation confirmation
  const handleConfirmReservation = async () => {
    try {
      const response = await api.post(`/confirm/${selectedScreening}`, {}, {
        withCredentials: true,
      });
      if (response.data.message) {
        alert('Reservation confirmed!');
        setReservationConfirmed(true);
      }
    } catch (error) {
      alert('Error confirming reservation: ' + error.response?.data || error.message);
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div>
      <h2>Screening Times</h2>
      <ul>
        {screeningTimes.map((time, index) => (
          <li key={index} onClick={() => handleScreeningClick(time)}>
            {time}
          </li>
        ))}
      </ul>

      {selectedScreening && (
        <div>
          <h3>Available Seats for {selectedScreening}</h3>
          <ul style={{ display: 'flex', flexWrap: 'wrap', listStyleType: 'none' }}>
            {availableSeats.length > 0 ? (
              availableSeats.map((seat, index) => {
                const seatNumber = seat.seatNumber;
                return (
                  <li
                    key={index}
                    onClick={() => handleSeatSelection(seatNumber)} 
                    style={{
                      margin: '5px',
                      padding: '10px',
                      backgroundColor: chosenSeats.includes(seatNumber) ? 'green' : 'lightgray',
                      cursor: 'pointer',
                      borderRadius: '5px',
                    }}
                  >
                    {seatNumber}
                  </li>
                );
              })
            ) : (
              <p>No available seats.</p>
            )}
          </ul>

          {chosenSeats.length > 0 && !reservationConfirmed && (
            <div>
              <button onClick={handleReservation}>
                Reserve Seats
              </button>
            </div>
          )}

          {reservationConfirmed && (
            <div>
              <button onClick={handleConfirmReservation}>
                Confirm Reservation
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ScreeningTimes;
