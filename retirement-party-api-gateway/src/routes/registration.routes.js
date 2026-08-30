import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { authorizeAdmin } from "../middleware/authorize-admin.js";
import { registrationClient } from "../services/registration-client.js";

const router = Router();

/**
 * Handle registration submission (Public - no Firebase token required)
 * Handles both POST /registrations and POST /api/registrations
 */
async function handleRegister(req, res, next) {
  try {
    const result = await registrationClient.register(req);
    return res.status(result.status).json(result.data);
  } catch (error) {
    next(error);
  }
}

/** List all registered guests (Admin only) */
async function handleGetAll(req, res, next) {
  try {
    const result = await registrationClient.getAll(req);
    return res.status(result.status).json(result.data);
  } catch (error) {
    next(error);
  }
}

/**
 * Look up guest by confirmation number (Public)
 */
async function handleGetByConfirmation(req, res, next) {
  try {
    const result = await registrationClient.getByConfirmationNumber(
      req,
      req.params.confirmationNumber
    );
    return res.status(result.status).json(result.data);
  } catch (error) {
    next(error);
  }
}

/**
 * Look up guest by MongoDB ID (Public)
 */
async function handleGetById(req, res, next) {
  try {
    const result = await registrationClient.getById(req, req.params.id);
    return res.status(result.status).json(result.data);
  } catch (error) {
    next(error);
  }
}

// Direct endpoints
router.post("/registrations", handleRegister);
router.get("/registrations", authenticate, authorizeAdmin, handleGetAll);
router.get("/registrations/confirmation/:confirmationNumber", handleGetByConfirmation);
router.get("/registrations/id/:id", handleGetById);

// /api prefixed aliases
router.post("/api/registrations", handleRegister);
router.get("/api/registrations/confirmation/:confirmationNumber", handleGetByConfirmation);
router.get("/api/registrations/id/:id", handleGetById);

export default router;

