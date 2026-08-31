import { Router } from "express";
import { internalAuth } from "../middleware/internal-auth.js";
import { receiveInternalEvent } from "../controllers/event.controller.js";

const router = Router();

/**
 * POST /internal/events
 *
 * Internal service-to-service event endpoint.
 * Protected by INTERNAL_SERVICE_TOKEN authentication.
 *
 * Called by:
 *   - Verification Service after successful check-in
 *   - Registration Service after successful guest registration
 *
 * NEVER expose this endpoint through the API Gateway or to the public internet.
 */
router.post("/internal/events", internalAuth, receiveInternalEvent);

export default router;
