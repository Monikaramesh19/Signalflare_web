import React, { createContext, useContext, useState, useEffect } from 'react';
import { syncOfflineQueue } from '../offline/syncManager';

type NetworkStatus = 'ONLINE' | 'SYNCING' | 'OFFLINE';

interface NetworkContextType {
  isOnline: boolean;
  status: NetworkStatus;
  triggerSync: () => Promise<void>;
  lastSyncTime: Date | null;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [status, setStatus] = useState<NetworkStatus>(
    navigator.onLine ? 'ONLINE' : 'OFFLINE'
  );
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(() => {
    const saved = localStorage.getItem('signalflare_last_sync');
    return saved ? new Date(saved) : null;
  });

  const triggerSync = async () => {
    const token = localStorage.getItem('signalflare_token');
    if (!token) return;

    setStatus('SYNCING');
    try {
      const syncResult = await syncOfflineQueue(token);
      if (syncResult && syncResult.success) {
        const now = new Date();
        setLastSyncTime(now);
        localStorage.setItem('signalflare_last_sync', now.toISOString());
      }
      setStatus('ONLINE');
    } catch (err) {
      console.error(err);
      setStatus('ONLINE'); // Fallback to online
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setStatus('ONLINE');
      // Trigger auto-sync when network returns
      triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setStatus('OFFLINE');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (navigator.onLine) {
      triggerSync();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <NetworkContext.Provider value={{ isOnline, status, triggerSync, lastSyncTime }}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};
