import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import firebaseConfig from '../firebase-applet-config.json';

const apps = getApps();
let app;

if (apps.length === 0) {
  app = initializeApp({
    projectId: firebaseConfig.projectId,
  });
} else {
  app = getApp();
}

export const adminDb = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const adminAuth = getAuth(app);
