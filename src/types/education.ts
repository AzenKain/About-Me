import { z } from "zod";

export const EducationSchema = z.object({
  id: z.string(),
  degree: z.string().min(1, "Degree is required"),
  field: z.string().min(1, "Field is required"),
  school: z.string().min(1, "School is required"),
  period: z.string().min(1, "Period is required"),
  location: z.string().nullable().optional(),
  courses: z.string().nullable().optional(),
  gpa: z.string().nullable().optional(),
  orderIndex: z.number().int().nullable().optional().default(0),
  createdAt: z.number().nullable().optional(),
});

export const InsertEducationSchema = EducationSchema.extend({
  id: z.string().optional(),
});

export type Education = z.infer<typeof EducationSchema>;
export type InsertEducation = z.infer<typeof InsertEducationSchema>;
