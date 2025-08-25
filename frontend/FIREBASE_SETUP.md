# Firebase Setup for AI Health App

## Overview
This application uses Firebase for authentication. For static exports (like Azure Static Web Apps), the app includes a fallback authentication system that works without Firebase configuration.

## Setup Options

### Option 1: Static Export (Recommended for Azure Static Web Apps)
The app is configured to work without Firebase configuration for static exports. Users can sign in with demo credentials:
- **Email:** demo@example.com
- **Password:** demo123

### Option 2: Full Firebase Integration
To use real Firebase authentication:

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication with Email/Password provider
3. Create a `.env.local` file in the frontend directory with your Firebase config:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key-here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

## Build Configuration
The app automatically detects whether Firebase is properly configured and falls back to demo authentication if needed. This ensures the app works in both development and production environments.

## Troubleshooting
If you encounter Firebase-related build errors:
1. Ensure all environment variables are properly set
2. Check that your Firebase project has Authentication enabled
3. Verify your API key is correct and not restricted
4. For static exports, the app will work with demo authentication even without Firebase config
