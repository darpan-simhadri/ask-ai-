import { Request, Response, NextFunction } from 'express';
import { createClient, User } from '@supabase/supabase-js';
import { config } from '../config';

// Initialize Supabase client
const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or malformed Authorization header' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token not found in Authorization header' });
    }

    // Verify token with Supabase and fetch authenticated user details
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired authentication token' });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({ error: 'Internal server authentication error' });
  }
}
