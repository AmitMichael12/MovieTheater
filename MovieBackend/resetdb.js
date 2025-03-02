const mongoose = require("mongoose");
const Screening = require("./screeningModel");

const mongoURI = "mongodb+srv://roeyk70:123ad123ad@movietheater.1vfsp.mongodb.net/?retryWrites=true&w=majority&appName=MovieTheater";

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Connected to MongoDB");

    const resetSeats = async () => {
      try {
        const screenings = await Screening.find();

        for (const screening of screenings) {
          // Update the seats for each screening to available
          const updatedSeats = screening.seats.map(seat => ({
            ...seat,
            status: "available",
            reservedBy: null, // Reset the reservation
            reservedAt: null, // Reset the reservation time
          }));

          // Update the screening with the reset seats
          screening.seats = updatedSeats;
          await screening.save(); // Save the updated screening
        }

        console.log("All screenings and seats have been reset to available.");
        mongoose.connection.close(); // Close the connection
      } catch (err) {
        console.error("Error resetting screenings and seats:", err);
        mongoose.connection.close();
      }
    };

    // Call the resetSeats function
    resetSeats();
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });
