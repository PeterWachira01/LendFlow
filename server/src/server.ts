import "dotenv/config";

import express from "express";
import cors from "cors";
import pool from "./db.js";

import authRoutes from "./routes/authRoutes.js";
import clientRoutes from "./routes/clientRoutes.js";
import loanRoutes from "./routes/loanRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";

const app = express();
const PORT = process.env.PORT || 5000;

// =========================
// MIDDLEWARE
// =========================

app.use(cors());
app.use(express.json());

// =========================
// ROUTES
// =========================

// Public authentication routes
app.use("/api/auth", authRoutes);

// Protected application routes
app.use("/api/clients", clientRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/payments", paymentRoutes);

// =========================
// DATABASE TEST
// =========================

pool
  .query("SELECT NOW()")
  .then((result) => {
    console.log(
      "Database connected:",
      result.rows[0],
    );
  })
  .catch((error) => {
    console.error(
      "Database connection failed:",
      error,
    );
  });

// =========================
// START SERVER
// =========================

app.listen(PORT, () => {
  console.log(
    `Server running on http://localhost:${PORT}`,
  );
});