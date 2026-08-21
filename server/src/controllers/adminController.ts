import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/db';
import os from 'os';

export const getAdminUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(users);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch admin user list' });
  }
};

export const getAdminAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const userCount = await prisma.user.count();
    const volunteerCount = await prisma.volunteer.count();
    const sosCount = await prisma.sOSRequest.count();
    const activeSosCount = await prisma.sOSRequest.count({
      where: { NOT: { status: { in: ['RESOLVED', 'CANCELLED'] } } },
    });
    const resourceReqCount = await prisma.resourceRequest.count();

    // Grouping by emergencyType
    const sosByType = await prisma.sOSRequest.groupBy({
      by: ['emergencyType'],
      _count: { id: true },
    });

    // Grouping by status
    const sosByStatus = await prisma.sOSRequest.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    // Grouping by severity
    const sosBySeverity = await prisma.sOSRequest.groupBy({
      by: ['severity'],
      _count: { id: true },
    });

    return res.json({
      summary: {
        users: userCount,
        volunteers: volunteerCount,
        totalSOS: sosCount,
        activeSOS: activeSosCount,
        resourceRequests: resourceReqCount,
      },
      charts: {
        byType: sosByType.map((t: any) => ({ type: t.emergencyType, count: t._count.id })),
        byStatus: sosByStatus.map((s: any) => ({ status: s.status, count: s._count.id })),
        bySeverity: sosBySeverity.map((v: any) => ({ severity: v.severity, count: v._count.id })),
      },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to build analytics data' });
  }
};

export const getSystemHealth = async (req: AuthRequest, res: Response) => {
  try {
    // Database connection test
    await prisma.$queryRaw`SELECT 1`;

    const freeMem = os.freemem();
    const totalMem = os.totalmem();
    const load = os.loadavg();

    return res.json({
      status: 'HEALTHY',
      database: 'CONNECTED',
      os: {
        platform: os.platform(),
        cpus: os.cpus().length,
        memoryUsage: `${Math.round(((totalMem - freeMem) / totalMem) * 100)}%`,
        loadAverage: load,
      },
    });
  } catch (err) {
    return res.status(500).json({
      status: 'DEGRADED',
      database: 'DISCONNECTED',
      error: 'Database connection failed',
    });
  }
};

export const getAuditLogs = async (req: AuthRequest, res: Response) => {
  try {
    const logs = await prisma.auditLog.findMany({
      include: {
        user: { select: { name: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return res.json(logs);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
};
