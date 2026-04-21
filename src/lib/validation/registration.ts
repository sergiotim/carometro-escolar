import { z } from "zod";

// SEC-003: Strict registration parameter validation to prevent path traversal and injection attacks
export const registrationSchema = z.object({
  registration: z
    .string()
    .min(1, "Registration is required")
    .max(50, "Registration too long")
    .regex(
      /^[a-zA-Z0-9-_.]+$/,
      "Registration must contain only alphanumeric characters, hyphens, underscores, and dots"
    ),
});

export type RegistrationParams = z.infer<typeof registrationSchema>;
