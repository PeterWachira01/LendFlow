import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  createLoan,
  getLoans,
  checkDefaults,
} from "../controllers/loanController.js";

const router = Router();

// Protect all loan routes
router.use(authMiddleware);

// Create a loan
router.post("/", createLoan);

// Get all loans
router.get("/", getLoans);

// Check and process overdue loans
router.post("/check-defaults", checkDefaults);

export default router;