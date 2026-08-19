import { z } from 'zod';

export const chatRequestSchema = z.object({
  message: z.string({
    required_error: 'message is required',
  }).min(1, 'message cannot be empty'),
  
  history: z.array(
    z.object({
      role: z.enum(['user', 'model'], {
        required_error: 'role is required for history items',
        invalid_type_error: 'role must be either "user" or "model"',
      }),
      content: z.string({
        required_error: 'content is required for history items',
      }).min(1, 'content cannot be empty in history items'),
    })
  ).optional().default([]),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
