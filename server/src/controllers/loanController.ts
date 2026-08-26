import type { Request, Response } from "express";
import pool from "../db.js";

// Create a new loan
export const createLoan = async (req: Request, res: Response) => {
  try {
    const { client_id, principal_amount } = req.body;

    if (!client_id || !principal_amount) {
      return res.status(400).json({
        error: "Client ID and principal amount are required",
      });
    }

    // Check whether the client exists
    const clientResult = await pool.query(
      "SELECT id FROM clients WHERE id = $1",
      [client_id],
    );

    if (clientResult.rows.length === 0) {
      return res.status(404).json({
        error: "Client not found",
      });
    }

    // Check whether the client has an unpaid loan
    const unpaidLoanResult = await pool.query(
      `
      SELECT id
      FROM loans
      WHERE client_id = $1
        AND status IN ('active', 'defaulted')
      LIMIT 1
      `,
      [client_id],
    );

    if (unpaidLoanResult.rows.length > 0) {
      return res.status(400).json({
        error: "Client has an unpaid loan and cannot receive another loan",
      });
    }

    const interestRate = 10;
    const interestAmount =
      Number(principal_amount) * (interestRate / 100);

    const amountDue =
      Number(principal_amount) + interestAmount;

    const result = await pool.query(
      `
      INSERT INTO loans (
        client_id,
        principal_amount,
        interest_rate,
        loan_date,
        due_date,
        amount_due
      )
      VALUES (
        $1,
        $2,
        $3,
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '30 days',
        $4
      )
      RETURNING *;
      `,
      [client_id, principal_amount, interestRate, amountDue],
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating loan:", error);

    return res.status(500).json({
      error: "Failed to create loan",
    });
  }
};

// Get all loans
export const getLoans = async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT
        c.full_name,
        l.id AS loan_id,
        l.principal_amount,
        l.interest_rate,
        l.amount_due,
        COALESCE(SUM(p.amount_paid), 0) AS total_paid,
        l.amount_due - COALESCE(SUM(p.amount_paid), 0) AS remaining_balance,
        l.loan_date,
        l.due_date,
        l.status
      FROM clients c
      JOIN loans l ON c.id = l.client_id
      LEFT JOIN payments p ON l.id = p.loan_id
      GROUP BY
        c.full_name,
        l.id,
        l.principal_amount,
        l.interest_rate,
        l.amount_due,
        l.loan_date,
        l.due_date,
        l.status
      ORDER BY l.id;
    `);

    return res.json(result.rows);
  } catch (error) {
    console.error("Error fetching loans:", error);

    return res.status(500).json({
      error: "Failed to fetch loans",
    });
  }
};

// Check for overdue loans and mark them as defaulted
export const checkDefaults = async (_req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Find active loans whose due date has passed
    const overdueLoans = await client.query(`
      SELECT
        l.id,
        l.principal_amount,
        l.amount_due,
        l.due_date
      FROM loans l
      WHERE l.status = 'active'
        AND l.due_date < CURRENT_DATE
    `);

    const defaultedLoans = [];

    for (const loan of overdueLoans.rows) {
      // Make sure this loan has not already been defaulted
      const existingDefault = await client.query(
        `
        SELECT id
        FROM loan_defaults
        WHERE loan_id = $1
        `,
        [loan.id],
      );

      if (existingDefault.rows.length > 0) {
        continue;
      }

      const penaltyRate = 1;
      const penaltyAmount =
        Number(loan.principal_amount) * (penaltyRate / 100);

      const newAmountDue =
        Number(loan.amount_due) + penaltyAmount;

      // Record the default
      await client.query(
        `
        INSERT INTO loan_defaults (
          loan_id,
          default_date,
          penalty_rate,
          penalty_amount,
          reason
        )
        VALUES (
          $1,
          CURRENT_DATE,
          $2,
          $3,
          $4
        )
        `,
        [
          loan.id,
          penaltyRate,
          penaltyAmount,
          "Loan passed its due date",
        ],
      );

      // Update loan
      await client.query(
        `
        UPDATE loans
        SET
          amount_due = $1,
          status = 'defaulted'
        WHERE id = $2
        `,
        [newAmountDue, loan.id],
      );

      defaultedLoans.push({
        loan_id: loan.id,
        penalty_amount: penaltyAmount,
        new_amount_due: newAmountDue,
      });
    }

    await client.query("COMMIT");

    return res.json({
      message: "Default check completed",
      defaulted_loans: defaultedLoans,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Error checking defaults:", error);

    return res.status(500).json({
      error: "Failed to check loan defaults",
    });
  } finally {
    client.release();
  }
};