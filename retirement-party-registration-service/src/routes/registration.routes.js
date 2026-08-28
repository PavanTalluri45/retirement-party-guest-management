import { Router } from "express";
import {
  register,
  getByConfirmationNumber,
  getById,
  healthCheck,
} from "../controllers/registration.controller.js";

const router = Router();

/** Health check */
router.get("/health", healthCheck);

/** Register a new guest */
router.post("/registrations", register);

/** Look up an attending guest by 4-digit confirmation number */
router.get("/registrations/confirmation/:confirmationNumber", getByConfirmationNumber);

/** Look up any guest by MongoDB ObjectId */
router.get("/registrations/id/:id", getById);

export default router;

