import { z } from "zod";

/**
 * Regex for ISO Date format (YYYY-MM-DD or full ISO 8601)
 */
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;

/**
 * Validator for date trend query parameters
 */
export const TrendQuerySchema = z
  .object({
    from: z
      .string()
      .regex(DATE_REGEX, "Invalid 'from' date format. Expected YYYY-MM-DD or ISO 8601 string.")
      .optional(),
    to: z
      .string()
      .regex(DATE_REGEX, "Invalid 'to' date format. Expected YYYY-MM-DD or ISO 8601 string.")
      .optional(),
    granularity: z.enum(["hour", "day"]).default("hour"),
  })
  .refine(
    (data) => {
      if (data.from && data.to) {
        const fromDate = new Date(data.from);
        const toDate = new Date(data.to);
        if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
          return false;
        }
        return fromDate <= toDate;
      }
      return true;
    },
    {
      message: "'from' date must be before or equal to 'to' date.",
      path: ["from"],
    }
  );

/**
 * Validator for pagination parameters (e.g. for recent checkins or staff leaderboard)
 */
export const PaginationQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int().min(1, "Page must be at least 1")),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .pipe(
      z
        .number()
        .int()
        .min(1, "Limit must be at least 1")
        .max(50, "Limit cannot exceed 50")
    ),
});

/**
 * Helper to validate query params against a Zod schema
 */
export function validateQuery(schema, query) {
  const result = schema.safeParse(query);
  if (!result.success) {
    const errorMessages = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    const error = new Error(`Validation Error: ${errorMessages}`);
    error.status = 400;
    error.code = "VALIDATION_ERROR";
    error.details = result.error.flatten();
    throw error;
  }
  return result.data;
}

