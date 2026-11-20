import { z } from "zod";

export const reelsQuerySchema = z.object({
  topic: z.string().optional(),
  tab: z.enum(["foryou", "following", "latest"]).default("foryou"),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(20).default(6),
});

export const addCommentSchema = z.object({
  body: z.string().min(1, "Izoh matni bo'sh bo'lmasligi kerak").max(1000, "Izoh 1000 belgidan oshmasligi kerak"),
  parentId: z.string().optional(),
});
