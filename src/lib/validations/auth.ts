import { z } from "zod";
import "@/lang/zod";
import { site } from "@/lang/site";

const v = site.validation;

// Shared by the client forms (React Hook Form) and the server actions
const email = z.email(v.email).trim().toLowerCase();
const password = z
  .string()
  .min(8, v.passwordMin)
  .max(72, v.passwordMax)
  .regex(/[a-zA-Z]/, v.passwordLetter)
  .regex(/[0-9]/, v.passwordNumber);

export const signInSchema = z.object({
  email,
  password: z.string().min(1, v.passwordRequired),
  remember: z.boolean().optional(),
});

export const signUpSchema = z
  .object({
    email,
    password,
    confirmPassword: z.string(),
    acceptTerms: z.literal(true, { error: v.acceptTerms }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: v.passwordsMismatch,
    path: ["confirmPassword"],
  });

export const profileSchema = z.object({
  name: z.string().trim().min(2, v.nameMin).max(60),
  email,
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, v.currentPasswordRequired),
    newPassword: password,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: v.passwordsMismatch,
    path: ["confirmPassword"],
  });

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
