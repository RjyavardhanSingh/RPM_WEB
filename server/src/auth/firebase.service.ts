// filepath: /home/snail/RPM_Minor_Project/server/src/auth/firebase.service.ts
// or wherever you initialize firebase-admin
import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as path from 'path'; // Import path module

@Injectable()
export class FirebaseService implements OnModuleInit {
  onModuleInit() {
    if (!admin.apps.length) {
      const serviceAccountPath = path.join(process.cwd(), 'config', 'firebase-service-account.json'); // Make sure this line uses the correct path
      console.log(`Looking for Firebase service account at: ${serviceAccountPath}`);
      // Make sure the path correctly points to your service account JSON file.
      // Example: if firebase.service.ts is in src/auth, and config is in server/config:
      // const serviceAccountPath = path.resolve(process.cwd(), 'config', 'firebase-service-account.json');

      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const serviceAccount = require(serviceAccountPath); // Use require for JSON

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          // databaseURL: "https://<YOUR_PROJECT_ID>.firebaseio.com" // Optional: if using Realtime Database
        });
        console.log('Firebase Admin SDK initialized successfully with service account.');
      } catch (error) {
        console.error('Error initializing Firebase Admin SDK with service account:', error);
        console.error(`Failed to load service account from: ${serviceAccountPath}`);
        // Consider throwing an error or exiting if Firebase is critical
      }
    }
  }

  async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    return admin.auth().verifyIdToken(idToken);
  }
}