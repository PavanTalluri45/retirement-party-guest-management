import * as registrationService from "../services/registration.service.js";
import { ConfirmationNumberParamSchema, IdParamSchema, PhoneParamSchema } from "../validators/registration.validator.js";
import { ObjectId } from "mongodb";

/**
 * POST /registrations
 */
export async function register(req, res, next) {
  try {
    const guest = await registrationService.registerGuest(req.body);

    return res.status(201).json({
      success: true,
      message: "Registration successful.",
      data: guest,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /registrations/confirmation/:confirmationNumber
 */
export async function getByConfirmationNumber(req, res, next) {
  try {
    // Validate param
    const parsed = ConfirmationNumberParamSchema.safeParse(req.params);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid confirmation number format.",
        errors: (parsed.error.issues || parsed.error.errors || []).map((e) => e.message),
      });
    }

    const guest = await registrationService.getGuestByConfirmationNumber(parsed.data.confirmationNumber);

    return res.status(200).json({
      success: true,
      data: guest,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /registrations/id/:id
 */
export async function getById(req, res, next) {
  try {
    // Validate ObjectId format
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid guest ID format.",
      });
    }

    const guest = await registrationService.getGuestById(req.params.id);

    return res.status(200).json({
      success: true,
      data: guest,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /registrations/phone/:phone
 */
export async function getByPhone(req, res, next) {
  try {
    const parsed = PhoneParamSchema.safeParse(req.params);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number format.",
        errors: (parsed.error.issues || parsed.error.errors || []).map((e) => e.message),
      });
    }

    const guest = await registrationService.getGuestByPhone(parsed.data.phone);

    return res.status(200).json({
      success: true,
      data: guest,
    });
  } catch (error) {
    next(error);
  }
}


/**
 * GET /health
 */
export async function healthCheck(req, res) {
  return res.status(200).json({
    success: true,
    service: "retirement-party-registration-service",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
}

