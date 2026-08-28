import { addToQueue, getQueue, removeFromQueue, clearQueue } from './db';
import axios from 'axios';

export interface MeshMessage {
  messageId: string;
  senderDeviceId: string;
  messageType: 'SOS' | 'MEDICAL_EMERGENCY' | 'RESOURCE_REQUEST' | 'TEXT_MESSAGE' | 'LOCATION_UPDATE' | 'RESCUE_ASSIGNMENT' | 'SHELTER_ALERT' | 'SYSTEM_ALERT';
  status: 'SAVED_LOCALLY' | 'RELAYING' | 'DELIVERED_TO_PEER' | 'DELIVERED_TO_RESCUE' | 'SERVER_SYNCED';
  hopCount: number;
  ttl: number; // in hours
  latitude: number;
  longitude: number;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  payload: string; // JSON payload details
  createdAt: number;
  deliveredAt?: number;
  serverSyncedAt?: number;
}

export interface MeshPeer {
  deviceId: string;
  name: string;
  signalStrength: 'STRONG' | 'MEDIUM' | 'WEAK';
  role: 'VICTIM' | 'VOLUNTEER' | 'RESCUE' | 'ADMIN';
  status: 'AVAILABLE' | 'RELAY_ACTIVE';
  lastSeenSec: number;
}

export interface MeshRouteStep {
  id: string;
  messageId: string;
  fromDevice: string;
  toDevice: string;
  status: string;
  timestamp: number;
}

const MAX_HOPS = 10;
const MSG_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Helper to prioritize queues
export const sortPriorityQueue = (messages: MeshMessage[]): MeshMessage[] => {
  const priorities = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
  return [...messages].sort((a, b) => {
    return (priorities[b.priority] || 0) - (priorities[a.priority] || 0);
  });
};

// Simulation State Class for Web Mocking
class MeshSimulationManager {
  public peers: MeshPeer[] = [
    { deviceId: 'SF-RESCUE-104', name: 'Rescue Alpha Team', signalStrength: 'STRONG', role: 'RESCUE', status: 'AVAILABLE', lastSeenSec: 2 },
    { deviceId: 'SF-VOL-219', name: 'Volunteer Priya', signalStrength: 'MEDIUM', role: 'VOLUNTEER', status: 'AVAILABLE', lastSeenSec: 5 },
    { deviceId: 'SF-USER-782', name: 'Relay Node Ram', signalStrength: 'WEAK', role: 'VICTIM', status: 'RELAY_ACTIVE', lastSeenSec: 12 },
    { deviceId: 'SF-USER-102', name: 'Relay Node Suresh', signalStrength: 'MEDIUM', role: 'VICTIM', status: 'AVAILABLE', lastSeenSec: 8 },
  ];

  public simulatedRoutes: MeshRouteStep[] = [];
  public receivedIds = new Set<string>();

  constructor() {
    this.loadSimulationCache();
  }

  private async loadSimulationCache() {
    try {
      const messages = await getQueue('mesh_messages');
      messages.forEach((m) => this.receivedIds.add(m.messageId));

      const routes = await getQueue('mesh_routes');
      this.simulatedRoutes = routes;
    } catch (err) {
      console.warn('Simulated database caches loading failed');
    }
  }

  // Deduplication Check & TTL / Hop filters
  public async receiveMessage(msg: MeshMessage, fromDevice: string, toDevice: string): Promise<{ success: boolean; error?: string }> {
    if (this.receivedIds.has(msg.messageId)) {
      return { success: false, error: 'DUPLICATE_DISCARDED' };
    }

    if (msg.hopCount >= MAX_HOPS) {
      return { success: false, error: 'MAX_HOPS_EXCEEDED' };
    }

    const elapsed = Date.now() - msg.createdAt;
    if (elapsed > MSG_TTL_MS) {
      return { success: false, error: 'MESSAGE_EXPIRED' };
    }

    // Process ingestion
    msg.hopCount += 1;
    this.receivedIds.add(msg.messageId);

    // Save locally to IndexedDB
    await addToQueue('mesh_messages', msg);

    // Track routing step
    const step: MeshRouteStep = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(),
      messageId: msg.messageId,
      fromDevice,
      toDevice,
      status: msg.status,
      timestamp: Date.now(),
    };
    this.simulatedRoutes.push(step);
    await addToQueue('mesh_routes', step);

    // Dispatch update notification event
    window.dispatchEvent(new CustomEvent('mesh_update'));

    return { success: true };
  }

  // Run full simulation run
  public async simulateRouterSend(
    payloadData: any,
    type: 'SOS' | 'MEDICAL_EMERGENCY' | 'RESOURCE_REQUEST' | 'LOCATION_UPDATE',
    priority: 'CRITICAL' | 'HIGH' | 'MEDIUM'
  ): Promise<string> {
    const messageId = `SF-SOS-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${(Math.random() * 100000).toFixed(0)}`;
    const msg: MeshMessage = {
      messageId,
      senderDeviceId: 'SF-USER-CURRENT',
      messageType: type,
      status: 'SAVED_LOCALLY',
      hopCount: 0,
      ttl: 24,
      latitude: payloadData.latitude || 13.0827,
      longitude: payloadData.longitude || 80.2707,
      priority,
      payload: JSON.stringify(payloadData),
      createdAt: Date.now(),
    };

    // 1. Save Locally
    await this.receiveMessage(msg, 'SF-USER-CURRENT', 'SF-USER-CURRENT');

    // 2. Simulate Hop to Volunteer
    setTimeout(async () => {
      msg.status = 'RELAYING';
      await this.receiveMessage(msg, 'SF-USER-CURRENT', 'SF-VOL-219');
    }, 1500);

    // 3. Simulate Hop to Rescue
    setTimeout(async () => {
      msg.status = 'DELIVERED_TO_RESCUE';
      await this.receiveMessage(msg, 'SF-VOL-219', 'SF-RESCUE-104');

      // 4. Synchronize with Server if online
      if (navigator.onLine) {
        try {
          const apiURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
          await axios.post(`${apiURL}/mesh/messages`, msg);
          msg.status = 'SERVER_SYNCED';
          await addToQueue('mesh_messages', msg);
          window.dispatchEvent(new CustomEvent('mesh_update'));
        } catch (err) {
          console.warn('Local mesh sync to central server failed (offline mode)');
        }
      }
    }, 3500);

    return messageId;
  }
}

export const meshSimulation = new MeshSimulationManager();
