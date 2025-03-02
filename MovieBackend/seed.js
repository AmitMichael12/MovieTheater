const mongoose = require("mongoose");
const Screening = require("./screeningModel");
require('dotenv').config()



const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Connected to MongoDB");

    const screeningsData = [
      { screeningTime: "10:00" },
      { screeningTime: "12:00" },
      { screeningTime: "14:00" },
      { screeningTime: "16:00" },
      { screeningTime: "18:00" },
    ];

    // Generate 50 seats for each screening
    const generateSeats = () => {
      const seats = [];
      for (let i = 1; i <= 50; i++) {
        seats.push({
          seatNumber: `A${i}`,
          status: "available", // All seats are initially available
          reservedBy: null,
          reservedAt: null,
        });
      }
      return seats;
    };

    // Prepare screenings with seats
    const screeningsWithSeats = screeningsData.map((screening) => ({
      screeningTime: screening.screeningTime,
      seats: generateSeats(),
    }));

    // Insert screenings and seats into the database
    Screening.insertMany(screeningsWithSeats)
      .then(() => {
        console.log("Database seeded successfully!");
        mongoose.connection.close();
      })
      .catch((err) => {
        console.error("Error seeding the database:", err);
        mongoose.connection.close();
      });
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });
