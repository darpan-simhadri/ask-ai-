import { Router, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { config } from '../config';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { chatRequestSchema } from '../validation/chat';

const router = Router();

// Initialize the Google Gen AI SDK
const ai = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY });

// Route to handle chat conversations with Gemini
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // 1. Validate request payload using Zod
    const parseResult = chatRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    const { message, history } = parseResult.data;

    // 2. Format history + current message for Gemini SDK contents structure
    // Gemini roles must be 'user' or 'model'
    const contents = [
      ...history.map((item) => ({
        role: item.role,
        parts: [{ text: item.content }],
      })),
      {
        role: 'user',
        parts: [{ text: message }],
      },
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Default stable model
      contents,
    });

    const replyText = response.text || '';

    // 4. Return the generated text reply
    return res.status(200).json({
      role: 'model',
      content: replyText,
    });

  } catch (error: any) {
    console.error('Gemini API Integration Error:', error);
    
    // Provide a descriptive user-friendly error response
    const status = error?.status || 500;
    const message = error?.message || 'An error occurred while generating content from Gemini API';
    
    return res.status(status).json({
      error: 'Gemini service error',
      message,
    });
  }
});

export default router;
