// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from 'firebase/app';

// Your web app's Firebase configuration
const firebaseConfig = {
  projectId: 'studio-4121314023-e5628',
  appId: '1:742018216558:web:e479eb90ef228714162c7f',
  apiKey: 'AIzaSyAVBo8O0nuyvw28YU7qBpNIVIdLNfMPjQI',
  authDomain: 'studio-4121314023-e5628.firebaseapp.com',
  messagingSenderId: '742018216558',
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export { app };
