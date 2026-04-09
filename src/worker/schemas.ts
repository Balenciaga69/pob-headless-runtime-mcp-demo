import { z } from "zod";

export const workerSuccessSchema = z.object({
  id: z.string().nullable(),
  ok: z.literal(true),
  result: z.unknown(),
  meta: z.object({
    request_id: z.string().nullable().optional(),
    api_version: z.string(),
    engine_version: z.string(),
    duration_ms: z.number(),
  }),
});

export const workerFailureSchema = z.object({
  id: z.string().nullable(),
  ok: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
    retryable: z.boolean().optional(),
  }),
  meta: z.object({
    request_id: z.string().nullable().optional(),
    api_version: z.string(),
    engine_version: z.string(),
    duration_ms: z.number(),
  }),
});

export const workerResponseSchema = z.union([workerSuccessSchema, workerFailureSchema]);

export type PobWorkerSuccessResponse = z.infer<typeof workerSuccessSchema>;
