import { Request, Response, NextFunction } from 'express';
import { adminAuth, adminDb } from '../config/firebase';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    name: string;
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token format' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Fetch user profile from Firestore to get role and name
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    
    if (!userDoc.exists) {
      return res.status(401).json({ error: 'Unauthorized: User profile not found in database' });
    }
    
    const userData = userDoc.data();
    
    req.user = {
      id: decodedToken.uid,
      email: decodedToken.email || userData?.email,
      role: userData?.role || 'VICTIM',
      name: userData?.name || 'Unknown User'
    };
    
    next();
  } catch (err) {
    console.error('Firebase Auth Error:', err);
    return res.status(401).json({ error: 'Unauthorized: Invalid token session' });
  }
};

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges' });
    }

    next();
  };
};
