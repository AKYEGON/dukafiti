import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create Supabase client with service role key for server-side operations (if available)
let supabase: any = null;
if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
}

export interface AuthenticatedRequest extends Request {
  user?: any;
  userId?: string;
}

export async function requireAuth(req: any, res: any, next: any) {
  try {
    // First try session-based auth (for our current implementation)
    if (req.session && req.session.user) {
      req.user = req.session.user;
      req.userId = req.session.user.id;
      return next();
    }

    // If no session, try Supabase Bearer token auth
    if (supabase) {
      const authHeader = req.headers.authorization;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        
        // Verify the JWT token using Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (!error && user) {
          req.user = user;
          req.userId = user.id;
          return next();
        }
      }
    }

    // If both methods fail, return unauthorized
    return res.status(401).json({ error: 'Authentication required' });
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
}

export async function optionalAuth(req: any, res: any, next: any) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (!error && user) {
        req.user = user;
        req.userId = user.id;
      }
    }
    
    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next();
  }
}

export async function getCurrentUser(req: any) {
  if (!supabase) {
    // Fall back to session-based user lookup
    if (!req.session.user) {
      return null;
    }
    return req.session.user;
  }
  return req.user || null;
}