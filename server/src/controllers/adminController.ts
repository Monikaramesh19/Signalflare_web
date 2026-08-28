import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { adminDb } from '../config/firebase';
import os from 'os';

export const getAdminUsers = async (req: AuthRequest, res: Response) => {
  try {
    const snapshot = await adminDb.collection('users').orderBy('createdAt', 'desc').get();
    const users = snapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email,
        name: data.name,
        phone: data.phone,
        role: data.role,
        createdAt: data.createdAt,
      };
    });
    return res.json(users);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch admin user list' });
  }
};

export const getAdminAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const userCountSnap = await adminDb.collection('users').count().get();
    const volunteerCountSnap = await adminDb.collection('volunteers').count().get();
    const sosCountSnap = await adminDb.collection('sosRequests').count().get();
    const resourceReqCountSnap = await adminDb.collection('resourceRequests').count().get();

    // Firestore doesn't have groupBy, fetch SOS requests to aggregate in memory
    const sosSnapshot = await adminDb.collection('sosRequests').get();
    
    let activeSosCount = 0;
    const typeCount: any = {};
    const statusCount: any = {};
    const severityCount: any = {};

    sosSnapshot.forEach((doc: any) => {
      const data = doc.data();
      
      if (data.status !== 'RESOLVED' && data.status !== 'CANCELLED') {
        activeSosCount++;
      }

      if (data.emergencyType) {
        typeCount[data.emergencyType] = (typeCount[data.emergencyType] || 0) + 1;
      }
      if (data.status) {
        statusCount[data.status] = (statusCount[data.status] || 0) + 1;
      }
      if (data.severity) {
        severityCount[data.severity] = (severityCount[data.severity] || 0) + 1;
      }
    });

    return res.json({
      summary: {
        users: userCountSnap.data().count,
        volunteers: volunteerCountSnap.data().count,
        totalSOS: sosCountSnap.data().count,
        activeSOS: activeSosCount,
        resourceRequests: resourceReqCountSnap.data().count,
      },
      charts: {
        byType: Object.keys(typeCount).map(k => ({ type: k, count: typeCount[k] })),
        byStatus: Object.keys(statusCount).map(k => ({ status: k, count: statusCount[k] })),
        bySeverity: Object.keys(severityCount).map(k => ({ severity: k, count: severityCount[k] })),
      },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to build analytics data' });
  }
};

export const getSystemHealth = async (req: AuthRequest, res: Response) => {
  try {
    // Database connection test (lightweight operation)
    await adminDb.collection('system').limit(1).get();

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
    const snapshot = await adminDb.collection('auditLogs')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    const logs = [];
    for (const doc of snapshot.docs) {
      const data = doc.data();
      let userData = null;
      if (data.userId) {
        const userDoc = await adminDb.collection('users').doc(data.userId).get();
        if (userDoc.exists) {
          const u = userDoc.data() as any;
          userData = { name: u.name, role: u.role };
        }
      }
      logs.push({
        id: doc.id,
        ...data,
        user: userData
      });
    }

    return res.json(logs);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
};
