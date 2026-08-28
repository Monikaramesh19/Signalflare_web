import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import path from 'path';
import fs from 'fs';

let credential;
const pathsToCheck = [
  path.resolve(process.cwd(), 'server', 'serviceAccountKey.json'),
  path.resolve(process.cwd(), 'serviceAccountKey.json'),
  path.resolve(__dirname, '../../serviceAccountKey.json')
];

for (const p of pathsToCheck) {
  if (fs.existsSync(p)) {
    const serviceAccount = JSON.parse(fs.readFileSync(p, 'utf8'));
    credential = cert(serviceAccount);
    break;
  }
}

const app = getApps().length === 0 ? initializeApp({
  projectId: 'signalflare-ff189',
  ...(credential ? { credential } : {})
}) : getApp();

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);
