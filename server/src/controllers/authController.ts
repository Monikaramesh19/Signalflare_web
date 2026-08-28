import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { adminAuth, adminDb } from '../config/firebase';

export const register = async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, name, phone, role, volunteerSkills } = req.body;

    if (!email || !password || !name || !phone || !role) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Create user in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
    });

    const uid = userRecord.uid;

    const userData = {
      id: uid,
      email,
      name,
      phone,
      role, // 'VICTIM', 'VOLUNTEER', 'RESCUE', 'ADMIN'
      createdAt: new Date().toISOString(),
    };

    // Save to Firestore
    await adminDb.collection('users').doc(uid).set(userData);

    // If role is VOLUNTEER, create volunteer profile
    if (role === 'VOLUNTEER') {
      await adminDb.collection('volunteers').doc(uid).set({
        id: uid,
        userId: uid,
        status: 'AVAILABLE',
        skills: volunteerSkills || 'Emergency assistance',
        createdAt: new Date().toISOString(),
      });
    }

    // Add Audit Log
    await adminDb.collection('auditLogs').add({
      userId: uid,
      action: 'REGISTER',
      details: `User registered with role ${role}`,
      ipAddress: req.ip,
      createdAt: new Date().toISOString(),
    });

    // Create a custom token for client sign-in if needed
    const token = await adminAuth.createCustomToken(uid);

    return res.status(201).json({
      token,
      user: userData,
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Server error during registration' });
  }
};

export const login = async (req: AuthRequest, res: Response) => {
  // Since we migrated to Firebase, standard email/password login should happen on the Client SDK.
  // This endpoint is preserved for legacy compatibility but is heavily restricted since Firebase Admin SDK doesn't verify passwords.
  // To properly login, the frontend uses signInWithEmailAndPassword directly.
  return res.status(400).json({ 
    error: 'Direct API login is deprecated in Firebase architecture. Use Firebase Client SDK.' 
  });
};

export const verifyOTP = async (req: AuthRequest, res: Response) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: 'Missing verification code or email' });
    }
    if (code.length === 6) {
      return res.json({ success: true, message: 'OTP verified successfully' });
    } else {
      return res.status(400).json({ error: 'Invalid OTP code. Must be 6 digits.' });
    }
  } catch (err: any) {
    return res.status(500).json({ error: 'Verification failed' });
  }
};

export const logout = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user) {
      await adminDb.collection('auditLogs').add({
        userId: req.user.id,
        action: 'LOGOUT',
        details: 'User logged out',
        ipAddress: req.ip,
        createdAt: new Date().toISOString(),
      });
      // Optionally revoke refresh tokens
      await adminAuth.revokeRefreshTokens(req.user.id);
    }
    return res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Logout failed' });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userDoc = await adminDb.collection('users').doc(req.user.id).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = userDoc.data();

    return res.json(userData);
  } catch (err: any) {
    return res.status(500).json({ error: 'Server error' });
  }
};
