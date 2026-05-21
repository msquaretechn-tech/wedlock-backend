// import fs from 'fs';
// import { google } from 'googleapis';
// import fetch from 'node-fetch';

// // Load service account credentials
// const serviceAccount = JSON.parse(fs.readFileSync('./service-account-key.json', 'utf8'));

// // FCM project ID
// const PROJECT_ID = serviceAccount.project_id;

// // Get Google Auth access token
// async function getAccessToken() {
//   const auth = new google.auth.GoogleAuth({
//     credentials: serviceAccount,
//     scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
//   });

//   const authClient = await auth.getClient();
//   const tokenResponse = await authClient.getAccessToken();
//   return tokenResponse.token;
// }

// // Send FCM notification
// async function sendNotification() {
//   const accessToken = await getAccessToken();

//   const message = {
//     message: {
//       token: 'ck0SZzWUTA2s-BuudTnppT:APA91bHT23xFcekUAhlCl9z-IjpHFCqoZLnHbb-RyGUDJWk8SedLEFbKpIYjfdfntM-KsyN-NUVEIvRIyk9P70UXFQLLoNccdYbQ3DNHGJKuO0E_mpqomkg', // Replace with actual device token
//       notification: {
//         title: 'this is form abhishek',
//         body: 'it is working',
//       },
//       data: {
//         customKey: 'notjignn',
//       },
//     },
//   };

//   const response = await fetch(`https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`, {
//     method: 'POST',
//     headers: {
//       Authorization: `Bearer ${accessToken}`,
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify(message),
//   });

//   const result = await response.json();
//   console.log('FCM Response:', result);
// }

// sendNotification().catch(console.error);
