import { Router } from "express";
import pool from "../db.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = Router();

// Protect all payment routes
router.use(authMiddleware);

// Create a payment
router.post("/", async (req, res) => {
  try {
    const { loan_id, amount_paid, payment_method, notes } = req.body;

    if (!loan_id || !amount_paid) {
      return res.status(400).json({
        error: "Loan ID and payment amount are required",
      });
    }

    // Check whether the loan exists
    const loanResult = await pool.query(
      `
      SELECT id, amount_due, status
      FROM loans
      WHERE id = $1
      `,
      [loan_id],
    );

    if (loanResult.rows.length === 0) {
      return res.status(404).json({
        error: "Loan not found",
      });
    }

    const loan = loanResult.rows[0];

    // Prevent payments on an already paid loan
    if (loan.status === "paid") {
      return res.status(400).json({
        error: "This loan has already been fully paid",
      });
    }

    // Calculate how much has already been paid
    const paidResult = await pool.query(
      `
      SELECT COALESCE(SUM(amount_paid), 0) AS total_paid
      FROM payments
      WHERE loan_id = $1
      `,
      [loan_id],
    );

    const totalPaid = Number(paidResult.rows[0].total_paid);
    const remainingBalance = Number(loan.amount_due) - totalPaid;

    // Prevent overpayment
    if (Number(amount_paid) > remainingBalance) {
      return res.status(400).json({
        error: `Payment exceeds remaining balance of ${remainingBalance}`,
      });
    }

    // Record the payment
    const paymentResult = await pool.query(
      `
      INSERT INTO payments (
        loan_id,
        amount_paid,
        payment_method,
        notes
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *;
      `,
      [loan_id, amount_paid, payment_method || null, notes || null],
    );

    const newTotalPaid = totalPaid + Number(amount_paid);
    const newBalance = Number(loan.amount_due) - newTotalPaid;

    // Automatically mark the loan as paid
    if (newBalance === 0) {
      await pool.query(
        `
        UPDATE loans
        SET status = 'paid'
        WHERE id = $1
        `,
        [loan_id],
      );
    }

    res.status(201).json({
      payment: paymentResult.rows[0],
      total_paid: newTotalPaid,
      remaining_balance: newBalance,
      loan_status: newBalance === 0 ? "paid" : loan.status,
    });
  } catch (error) {
    console.error("Error recording payment:", error);

    res.status(500).json({
      error: "Failed to record payment",
    });
  }
});

// Get payment history
router.get("/", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.id,
        p.loan_id,
        c.full_name,
        p.amount_paid,
        p.payment_date,
        p.payment_method,
        p.notes,
        p.created_at
      FROM payments p
      JOIN loans l ON p.loan_id = l.id
      JOIN clients c ON l.client_id = c.id
      ORDER BY p.payment_date DESC, p.id DESC;
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching payments:", error);

    res.status(500).json({
      error: "Failed to fetch payments",
    });
  }
});

export default router;