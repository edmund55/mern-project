const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");
require("dotenv").config();

const placesRouter = require("./routes/places");
const usersRouter = require("./routes/users");

const notFoundMiddleware = require("./middleware/not-found");
const errorHandlerMiddleware = require("./middleware/error-handler");

const app = express();

app.use(express.json());

app.use("/uploads/images", express.static(path.join("uploads", "images")));

app.use(cors());
// app.use((req, res, next) => {
//   res.setHeader("Access-Control-Allow-Origin", "*");
//   res.setHeader(
//     "Access-Control-Allow-Headers",
//     "Origin, X-Requested-With, Content-Type, Accept, Authorization"
//   );
//   res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");
//   next();
// });

app.use("/api/v1/places", placesRouter);
app.use("/api/v1/users", usersRouter);

// app.use((req, res, next) => {
//   throw new NotFoundError("Could not find this route.");
// });
// app.use((err, req, res, next) => {
//   if (res.headerSent) {
//     return next(err);
//   }
//   res
//     .status(err.code || 500)
//     .json({ message: err.message || "An unknown error occurred!" });
// });
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const port = 3000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to database.");
    app.listen(port);
    console.log(`Listening to port ${port}...`);
  })
  .catch((err) => {
    console.log(err);
  });
