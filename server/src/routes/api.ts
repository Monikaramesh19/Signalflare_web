import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  register,
  login,
  verifyOTP,
  logout,
  getMe,
} from '../controllers/authController';
import {
  createSOS,
  getSOSRequests,
  getSOSDetails,
  updateSOSStatus,
  deleteSOSRequest,
} from '../controllers/sosController';
import {
  createEmergencyRequest,
  getEmergencyRequests,
  createResourceRequest,
  getResourceRequests,
  getResourceRequestDetails,
  updateResourceRequest,
} from '../controllers/requestController';
import {
  getResources,
  createResource,
  updateResource,
  deleteResource,
} from '../controllers/resourceController';
import {
  getShelters,
  createShelter,
  updateShelter,
} from '../controllers/shelterController';
import {
  getVolunteers,
  updateVolunteer,
  getVolunteerTasks,
  acceptRescueTask,
} from '../controllers/volunteerController';
import {
  getRescueTeams,
  createRescueTeam,
  assignRescueTeam,
  getRescueOperations,
} from '../controllers/rescueController';
import {
  getMessages,
  sendMessage,
} from '../controllers/messageController';
import {
  getNotifications,
  markNotificationRead,
} from '../controllers/notificationController';
import {
  syncOfflineData,
  getSyncStatus,
} from '../controllers/syncController';
import {
  publishMeshMessage,
  syncMeshBatch,
  acknowledgeMessages,
  getMeshStatus,
  getMeshMessageDetails,
} from '../controllers/meshController';
import {
  getAdminUsers,
  getAdminAnalytics,
  getSystemHealth,
  getAuditLogs,
} from '../controllers/adminController';

const router = Router();

// ================= AUTHENTICATION =================
router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/verify', verifyOTP);
router.post('/auth/logout', authenticate, logout);
router.get('/auth/me', authenticate, getMe);

// ================= SOS ENDPOINTS =================
router.post('/sos', authenticate, createSOS);
router.get('/sos', authenticate, getSOSRequests);
router.get('/sos/:id', authenticate, getSOSDetails);
router.put('/sos/:id', authenticate, updateSOSStatus);
router.delete('/sos/:id', authenticate, deleteSOSRequest);

// ================= GENERAL & RESOURCE REQUESTS =================
router.post('/requests/emergency', authenticate, createEmergencyRequest);
router.get('/requests/emergency', authenticate, getEmergencyRequests);

router.post('/requests', authenticate, createResourceRequest);
router.get('/requests', authenticate, getResourceRequests);
router.get('/requests/:id', authenticate, getResourceRequestDetails);
router.put('/requests/:id', authenticate, updateResourceRequest);

// ================= RESOURCES (INVENTORY) =================
router.get('/resources', authenticate, getResources);
router.post('/resources', authenticate, authorize(['RESCUE', 'ADMIN']), createResource);
router.put('/resources/:id', authenticate, authorize(['RESCUE', 'ADMIN']), updateResource);
router.delete('/resources/:id', authenticate, authorize(['RESCUE', 'ADMIN']), deleteResource);

// ================= SHELTERS =================
router.get('/shelters', authenticate, getShelters);
router.post('/shelters', authenticate, authorize(['RESCUE', 'ADMIN']), createShelter);
router.put('/shelters/:id', authenticate, authorize(['RESCUE', 'ADMIN']), updateShelter);

// ================= VOLUNTEERS =================
router.get('/volunteers', authenticate, getVolunteers);
router.put('/volunteers/profile', authenticate, updateVolunteer);
router.get('/volunteers/tasks', authenticate, getVolunteerTasks);
router.post('/volunteers/tasks/:id/accept', authenticate, acceptRescueTask);

// ================= RESCUE OPERATIONS =================
router.get('/rescue-teams', authenticate, getRescueTeams);
router.post('/rescue-teams', authenticate, authorize(['RESCUE', 'ADMIN']), createRescueTeam);
router.post('/rescue/assign', authenticate, authorize(['RESCUE', 'ADMIN']), assignRescueTeam);
router.get('/rescue/operations', authenticate, getRescueOperations);

// ================= CHAT MESSAGES =================
router.get('/messages', authenticate, getMessages);
router.post('/messages', authenticate, sendMessage);

// ================= NOTIFICATIONS =================
router.get('/notifications', authenticate, getNotifications);
router.put('/notifications/:id/read', authenticate, markNotificationRead);

// ================= OFFLINE AUTOMATIC SYNC =================
router.post('/sync', authenticate, syncOfflineData);
router.get('/sync/status', getSyncStatus);

// ================= OFFLINE MESH SYSTEM =================
router.post('/mesh/messages', authenticate, publishMeshMessage);
router.post('/mesh/batch', authenticate, syncMeshBatch);
router.post('/mesh/acknowledge', authenticate, acknowledgeMessages);
router.get('/mesh/status', authenticate, getMeshStatus);
router.get('/mesh/messages/:id', authenticate, getMeshMessageDetails);

// ================= ADMIN CONSOLE =================
router.get('/admin/users', authenticate, authorize(['ADMIN']), getAdminUsers);
router.get('/admin/analytics', authenticate, authorize(['RESCUE', 'ADMIN']), getAdminAnalytics);
router.get('/admin/system-health', authenticate, authorize(['ADMIN']), getSystemHealth);
router.get('/admin/audit-logs', authenticate, authorize(['ADMIN']), getAuditLogs);

export default router;
