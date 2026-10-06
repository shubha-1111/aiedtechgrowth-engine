import { z } from "zod";
import { branches } from "@/lib/quiz";

export const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  college: z.string().min(2, "College name must be at least 2 characters").max(150),
  branch: z.enum(branches),
  year: z.coerce.number().int().min(1).max(4),
  whatsapp_opt_in: z.boolean().default(false),
  referred_by_code: z.string().optional().nullable()
});

export type ProfileInput = z.infer<typeof profileSchema>;

export function generateRefCode(userId: string): string {
  const cleanId = userId.replace(/-/g, "").toUpperCase();
  return `NXT_${cleanId.slice(0, 6)}`;
}
