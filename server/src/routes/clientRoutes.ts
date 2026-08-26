import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import pool from "../db.js";

const router = Router();

// Protect all client routes
router.use(authMiddleware);

// GET all clients
router.get("/", async (_req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        id,
        full_name,
        phone,
        national_id,
        email,
        address,
        created_at
      FROM clients
      ORDER BY id;
      `,
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching clients:", error);

    res.status(500).json({
      error: "Failed to fetch clients",
    });
  }
});

// DELETE a client
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Check whether the client has any outstanding loan balance
    const outstandingLoan = await pool.query(
      `
      SELECT
        l.id,
        l.amount_due,
        COALESCE(SUM(p.amount_paid), 0) AS total_paid,
        l.amount_due - COALESCE(SUM(p.amount_paid), 0) AS remaining_balance
      FROM loans l
      LEFT JOIN payments p
        ON p.loan_id = l.id
      WHERE l.client_id = $1
      GROUP BY l.id, l.amount_due
      HAVING l.amount_due - COALESCE(SUM(p.amount_paid), 0) > 0;
      `,
      [id],
    );

    // Don't delete clients who still owe money
    if (outstandingLoan.rows.length > 0) {
      return res.status(400).json({
        error:
          "This client cannot be deleted because they still have an outstanding loan balance.",
      });
    }

    // Delete the client
    const result = await pool.query(
      `
      DELETE FROM clients
      WHERE id = $1
      RETURNING *;
      `,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Client not found",
      });
    }

    res.json({
      message: "Client deleted successfully",
      client: result.rows[0],
    });
  } catch (error) {
    console.error("Error deleting client:", error);

    res.status(500).json({
      error: "Failed to delete client",
    });
  }
});

// POST a new client
router.post("/", async (req, res) => {
  try {
    const {
      full_name,
      phone,
      national_id,
      email,
      address,
    } = req.body;

    if (!full_name || !phone || !national_id) {
      return res.status(400).json({
        error:
          "Full name, phone, and national ID are required",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO clients (
        full_name,
        phone,
        national_id,
        email,
        address
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
      `,
      [
        full_name,
        phone,
        national_id,
        email || null,
        address || null,
      ],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating client:", error);

    res.status(500).json({
      error: "Failed to create client",
    });
  }
});

export default router;