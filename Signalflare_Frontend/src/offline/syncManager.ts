import axios from 'axios';
import { getQueue, removeFromQueue } from './db';
import type { OfflineSOS, OfflineResourceReq, OfflineMessage } from './db';

const getApiUrl = () => {
  const url = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  return url;
};

export interface SyncResult {
  success: boolean;
  processedCount: number;
  results: { tempId: string; status: 'SUCCESS' | 'FAILED'; originalId?: string; error?: string }[];
}

export const syncOfflineQueue = async (token: string): Promise<SyncResult | null> => {
  try {
    const sosItems: OfflineSOS[] = await getQueue('sos_queue');
    const resourceItems: OfflineResourceReq[] = await getQueue('resource_queue');
    const messageItems: OfflineMessage[] = await getQueue('message_queue');

    const totalItems = sosItems.length + resourceItems.length + messageItems.length;
    if (totalItems === 0) {
      return null;
    }

    const queuePayload: any[] = [];

    // Map SOS
    sosItems.forEach((item) => {
      queuePayload.push({
        id: item.id,
        action: 'CREATE_SOS',
        payload: {
          emergencyType: item.emergencyType,
          severity: item.severity,
          peopleCount: item.peopleCount,
          locationLat: item.locationLat,
          locationLng: item.locationLng,
          address: item.address,
          message: item.message,
          contactPhone: item.contactPhone,
          photo: item.photo,
        },
      });
    });

    // Map Resource Requests
    resourceItems.forEach((item) => {
      queuePayload.push({
        id: item.id,
        action: 'CREATE_RESOURCE_REQ',
        payload: {
          resourceName: item.resourceName,
          quantity: item.quantity,
          locationLat: item.locationLat,
          locationLng: item.locationLng,
          address: item.address,
          contactPhone: item.contactPhone,
        },
      });
    });

    // Map Messages
    messageItems.forEach((item) => {
      queuePayload.push({
        id: item.id,
        action: 'SEND_MESSAGE',
        payload: {
          receiverId: item.receiverId,
          content: item.content,
        },
      });
    });

    // Send payload to backend sync endpoint
    const response = await axios.post(
      `${getApiUrl()}/sync`,
      { queue: queuePayload },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const { results } = response.data;

    // Process reconciliation
    for (const res of results) {
      if (res.status === 'SUCCESS') {
        // Find which queue it came from and remove it
        if (sosItems.some((x) => x.id === res.tempId)) {
          await removeFromQueue('sos_queue', res.tempId);
        } else if (resourceItems.some((x) => x.id === res.tempId)) {
          await removeFromQueue('resource_queue', res.tempId);
        } else if (messageItems.some((x) => x.id === res.tempId)) {
          await removeFromQueue('message_queue', res.tempId);
        }
      }
    }

    // Dispatch system-wide sync finished event
    window.dispatchEvent(new CustomEvent('sync_completed', { detail: results }));

    return {
      success: true,
      processedCount: results.filter((r: any) => r.status === 'SUCCESS').length,
      results,
    };
  } catch (error) {
    console.error('Offline synchronization failed:', error);
    return {
      success: false,
      processedCount: 0,
      results: [],
    };
  }
};
