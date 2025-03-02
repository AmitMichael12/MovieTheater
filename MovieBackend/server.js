const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { v4: uuidv4 } = require("uuid");
const mongoose = require("mongoose");
const Screening = require("./screeningModel");
const moment = require("moment");
require('dotenv').config()




const app = express();
const PORT = 5000;


app.use(express.json()); 
const corsOptions = {
    origin: "http://localhost:5173", 
    credentials: true,  
  };
  
  app.use(cors(corsOptions));app.use(cookieParser());

const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI, {
  }).then(() => console.log("Connected to MongoDB"));


app.use((req, res, next) => {
    if (!req.cookies.userId) {
      res.cookie("userId", uuidv4(), { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
    }
    next();
  });

  // Helper function to check for expired reservations
const releaseExpiredReservations = async () => {
    const currentTime = new Date();
    try {
      const screenings = await Screening.find();
  
      for (let screening of screenings) {
        screening.seats.forEach(seat => {
          if (seat.status === "reserved" && seat.reservedAt) {
            const timeElapsed = moment(currentTime).diff(moment(seat.reservedAt), "minutes");
            if (timeElapsed >= 15) {
              seat.status = "available";
              seat.reservedBy = null;
              seat.reservedAt = null;
            }
          }
        });
  
        await screening.save();
      }
  
      console.log("Expired reservations released.");
    } catch (error) {
      console.error("Error releasing expired reservations:", error);
    }
  };
  
  setInterval(releaseExpiredReservations, 60 * 1000);

  app.get("/", (req, res) => {
    const userId = req.cookies.userId;
    res.send(`Your client ID is: ${userId}`);
  });

  app.get("/seats/:screeningTime", async (req, res) => {
    const { screeningTime } = req.params;
    const userId = req.cookies.userId;
  
    if (!userId) {
      return res.status(401).send("User must be logged in.");
    }
  
    try {
      const screening = await Screening.findOne({ screeningTime });
  
      if (!screening) {
        return res.status(404).send("Screening not found.");
      }
  
      const availableSeats = screening.seats.filter(seat => seat.status === "available");
      const reservedSeats = screening.seats.filter(seat => seat.status === "reserved" && seat.reservedBy === userId);
  
      // Send both available and reserved seats to the frontend
      res.json({
        availableSeats: availableSeats,
        reservedSeats: reservedSeats,
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("Error fetching seats.");
    }
  });

// Reserve seats for a screening
app.post("/reserve/:screeningTime", async (req, res) => {
    const { screeningTime } = req.params;
    const { seats } = req.body;
    const userId = req.cookies.userId;
  
    if (!seats || seats.length === 0 || seats.length > 4) {
      return res.status(400).send("You can select up to 4 seats.");
    }
  
    if (!userId) {
      return res.status(401).send("You must be recognized as a user.");
    }
  
    try {
      const screening = await Screening.findOne({ screeningTime });
  
      if (!screening) {
        return res.status(404).send("Screening not found.");
      }
  
      // Check if selected seats are available
      const unavailableSeats = seats.filter(seat => {
        const seatFound = screening.seats.find(s => s.seatNumber === seat && s.status === "available");
        return !seatFound;
      });
  
      if (unavailableSeats.length > 0) {
        return res.status(400).send(`The following seats are not available: ${unavailableSeats.join(", ")}`);
      }
  
      // Reserve the selected seats
      for (let seat of seats) {
        const seatIndex = screening.seats.findIndex(s => s.seatNumber === seat);
        if (seatIndex !== -1) {
          screening.seats[seatIndex].status = "reserved";
          screening.seats[seatIndex].reservedBy = userId;
          screening.seats[seatIndex].reservedAt = new Date();
        }
      }
  
      await screening.save();
  
      res.json({ message: "Seats reserved successfully." });
    } catch (error) {
      console.error(error);
      res.status(500).send("Error reserving seats.");
    }
  });

  // Confirm reservation (after user selects seats)
app.post("/confirm/:screeningTime", async (req, res) => {
    const { screeningTime } = req.params;
    const userId = req.cookies.userId;
  
    if (!userId) {
      return res.status(401).send("You must be recognized as a user IM HERE.");
    }
  
    try {
      const screening = await Screening.findOne({ screeningTime });
  
      if (!screening) {
        return res.status(404).send("Screening not found.");
      }
  
      // Find reserved seats by this user
      const reservedSeats = screening.seats.filter(seat => seat.reservedBy === userId && seat.status === "reserved");
  
      if (reservedSeats.length === 0) {
        return res.status(404).send("No reserved seats found.");
      }
  
      // Check if the reservation has expired
      const reservationExpired = reservedSeats.some(seat => {
        const timeElapsed = moment().diff(moment(seat.reservedAt), "minutes");
        return timeElapsed >= 15;
      });
  
      if (reservationExpired) {
        // Release the seats if expired
        reservedSeats.forEach(seat => {
          seat.status = "available";
          seat.reservedBy = null;
          seat.reservedAt = null;
        });
  
        await screening.save();
        return res.status(400).send("Your reservation has expired. Please reserve again.");
      }
  
      // Confirm the reservation by marking seats as "booked"
      reservedSeats.forEach(seat => {
        seat.status = "booked";
      });
  
      await screening.save();
  
      res.json({ message: "Reservation confirmed.", reservedSeats: reservedSeats.map(seat => seat.seatNumber) });
    } catch (error) {
      console.error(error);
      res.status(500).send("Error confirming reservation.");
    }
  });

app.get("/screening-times", async (req, res) => {
    try {
      const screenings = await Screening.find({}, 'screeningTime');
      const screeningTimes = screenings.map(screening => screening.screeningTime);
  
      res.json({ screeningTimes });
    } catch (error) {
      console.error(error);
      res.status(500).send("Error fetching screening times.");
    }
  });

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });