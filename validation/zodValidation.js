const { z } = require("zod");

const AttemptZod = z.object({
  at: z.string().datetime(),          // ISO string
  statusCode: z.number(),
  ok: z.boolean(),
  error: z.string().optional().nullable(),
});

const NoteZod = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  releaseAt: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: "Invalid ISO datetime",
    }),
  webhookUrl: z.string().url(),
  status: z.enum(["pending", "delivered", "failed", "dead"]).optional(),
  attempts: z.array(AttemptZod).optional(),
  deliveredAt: z.string().datetime().nullable().optional()
});

module.exports ={NoteZod}

