const Screening = require("./screeningModel");

const Screening = require("../models/screeningModel");

// Reserve seats for a specific screening time
const reserveSeats = async (req, res) => {
  const { screeningTime } = req.params;
  const { seats } = req.body;
  const userId = req.cookies.userId; // Get user ID from cookie

  try {
    const screening = await Screening.findOne({ screeningTime });

    if (!screening) {
      return res.status(404).send("Screening not found");
    }

    // Check if selected seats are available
    for (const seat of seats) {
      const seatInfo = screening.seats.find(s => s.seatNumber === seat);
      if (seatInfo.status !== "available") {
        return res.status(400).send(`Seat ${seat} is already reserved or booked`);
      }
    }

    // Reserve seats for the user
    for (const seat of seats) {
      const seatIndex = screening.seats.findIndex(s => s.seatNumber === seat);
      screening.seats[seatIndex].status = "reserved";
      screening.seats[seatIndex].reservedBy = userId;
      screening.seats[seatIndex].reservedAt = new Date();
    }

    // Save the updated screening
    await screening.save();

    res.send({ message: `Seats reserved successfully!`, reservedSeats: seats });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};

// Cancel a reservation for a specific seat
const cancelReservation = async (req, res) => {
  const { screeningTime, seatNumber } = req.params;
  const userId = req.cookies.userId;

  try {
    const screening = await Screening.findOne({ screeningTime });

    if (!screening) {
      return res.status(404).send("Screening not found");
    }

    const seat = screening.seats.find(s => s.seatNumber === seatNumber);

    if (!seat) {
      return res.status(404).send("Seat not found");
    }

    if (seat.reservedBy !== userId) {
      return res.status(403).send("You can't cancel a reservation you didn't make");
    }

    // Cancel the reservation
    seat.status = "available";
    seat.reservedBy = null;
    seat.reservedAt = null;

    // Save the updated screening
    await screening.save();

    res.send({ message: `Reservation for seat ${seatNumber} cancelled successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};

module.exports = {
  reserveSeats,
  cancelReservation
};

