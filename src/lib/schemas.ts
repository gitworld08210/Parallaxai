import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required"),
});

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const profileSchema = z.object({
  display_name: z.string().min(1, "Display name is required").max(50, "Display name must be 50 characters or less"),
  username: z
    .string()
    .min(1, "Username is required")
    .max(24, "Username must be 24 characters or less")
    .regex(/^[a-z0-9_.]+$/, "Username can only contain lowercase letters, numbers, underscores, and periods"),
  bio: z.string().max(200, "Bio must be 200 characters or less").optional(),
});

export const composeSchema = z
  .object({
    content: z.string().max(2200, "Content must be 2200 characters or less"),
    hasMedia: z.boolean(),
  })
  .refine((data) => data.content.trim().length > 0 || data.hasMedia, {
    message: "Add a thought or media",
    path: ["content"],
  });

export const reportSchema = z.object({
  reason: z.string().min(1, "Reason is required"),
});

export type SignupFormData = z.infer<typeof signupSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
export type ComposeFormData = z.infer<typeof composeSchema>;
export type ReportFormData = z.infer<typeof reportSchema>;
