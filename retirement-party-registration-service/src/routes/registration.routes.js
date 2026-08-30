import { Router } from "express";
import {
  register,
  getAll,
  getByConfirmationNumber,
  getByPhone,
  getById,
  healthCheck,
} from "../controllers/registration.controller.js";

const router = Router();

/** Health check */
router.get("/health", healthCheck);

/** Register a new guest */
router.post("/registrations", register);

/** List all registered guests for the admin gateway */
router.get("/registrations", getAll);

/** Look up an attending guest by 4-digit confirmation number */
router.get("/registrations/confirmation/:confirmationNumber", getByConfirmationNumber);

/** Look up a guest by registered 10-digit phone number */
router.get("/registrations/phone/:phone", getByPhone);

/** Look up any guest by MongoDB ObjectId */
router.get("/registrations/id/:id", getById);

export default router;


