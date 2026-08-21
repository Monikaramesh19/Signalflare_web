import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-signalflare-jwt-key-2026';

export const register = async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, name, phone, role, volunteerSkills } = req.body;

    if (!email || !password || !name || !phone || !role) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        role, // 'VICTIM', 'VOLUNTEER', 'RESCUE', 'ADMIN'
      },
    });

    // If role is VOLUNTEER, create volunteer profile
    if (role === 'VOLUNTEER') {
      await prisma.volunteer.create({
        data: {
          userId: user.id,
          status: 'AVAILABLE',
          skills: volunteerSkills || 'Emergency assistance',
        },
      });
    }

    // Add Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'REGISTER',
        details: `User registered with role ${role}`,
        ipAddress: req.ip,
      },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Server error during registration' });
  }
};

export const login = async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Missing credentials' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { volunteer: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Add Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        details: `User logged in`,
        ipAddress: req.ip,
      },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        volunteer: user.volunteer,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Server error during login' });
  }
};

export const verifyOTP = async (req: AuthRequest, res: Response) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: 'Missing verification code or email' });
    }
    // Simulation: accept any 6-digit code for ease of demonstration
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
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'LOGOUT',
          details: 'User logged out',
          ipAddress: req.ip,
        },
      });
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

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        volunteer: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json(user);
  } catch (err: any) {
    return res.status(500).json({ error: 'Server error' });
  }
};
