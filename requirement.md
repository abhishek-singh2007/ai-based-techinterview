# Requirements Documentation

## Project Overview
**PrepGuru** (also referred to as IntroGuru) is an AI-powered mock interview platform that helps users practice job interviews with real-time voice interaction and receive detailed feedback on their performance.

## System Requirements

### Prerequisites
- **Node.js**: Version 20.x or higher
- **npm**: Version 9.x or higher (comes with Node.js)
- **Firebase Account**: For authentication and database
- **Google AI API Key**: For Gemini AI integration
- **VAPI Account**: For voice AI assistant functionality

### Operating System
- Windows, macOS, or Linux
- Modern web browser (Chrome, Firefox, Safari, Edge - latest versions)

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Firebase Admin SDK Configuration
FIREBASE_PROJECT_ID="your-firebase-project-id"
FIREBASE_PRIVATE_KEY="your-firebase-private-key"
FIREBASE_CLIENT_EMAIL="your-firebase-client-email"

# Google Generative AI
GOOGLE_GENERATIVE_AI_API_KEY="your-google-ai-api-key"

# VAPI Configuration
NEXT_PUBLIC_VAPI_WEB_TOKEN="your-vapi-web-token"
NEXT_PUBLIC_VAPI_WORKFLOW_ID="your-vapi-workflow-id"
```

### How to Obtain API Keys

#### Firebase Setup
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Enable Authentication (Email/Password provider)
4. Enable Firestore Database
5. Go to Project Settings > Service Accounts
6. Generate new private key (downloads JSON file)
7. Extract `project_id`, `private_key`, and `client_email` from the JSON

#### Google AI API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create or select a project
3. Generate API key for Gemini API

#### VAPI Configuration
1. Sign up at [VAPI.ai](https://vapi.ai/)
2. Create a new assistant/workflow
3. Get your Web Token from dashboard
4. Get your Workflow ID from the workflow settings

## Installation Steps

### 1. Clone the Repository
```bash
git clone <repository-url>
cd prepwise
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
- Copy `.env.local.example` to `.env.local` (if provided)
- Or create `.env.local` and add all required variables as shown above

### 4. Firebase Client Configuration
Update `firebase/client.ts` with your Firebase web app configuration:
```typescript
const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id",
    measurementId: "your-measurement-id"
};
```

### 5. Firestore Database Setup
Create the following collections in Firestore:
- `users` - Stores user profiles
- `interviews` - Stores interview configurations
- `feedback` - Stores interview feedback and scores

## Running the Application

### Development Mode
```bash
npm run dev
```
The application will be available at `http://localhost:3000`

### Production Build
```bash
npm run build
npm start
```

### Linting
```bash
npm run lint
```

## Dependencies

### Core Dependencies
- **Next.js 15.5.7** - React framework with App Router
- **React 19.1.0** - UI library
- **TypeScript 5.x** - Type safety
- **Tailwind CSS 4.x** - Styling framework

### Authentication & Database
- **Firebase 12.2.1** - Client SDK
- **Firebase Admin 13.5.0** - Server SDK

### AI Integration
- **@ai-sdk/google 2.0.11** - Google AI SDK
- **ai 5.0.28** - Vercel AI SDK
- **@vapi-ai/web 2.3.9** - Voice AI integration

### UI Components
- **@radix-ui/react-label** - Accessible label component
- **@radix-ui/react-slot** - Composition utility
- **lucide-react** - Icon library
- **sonner** - Toast notifications
- **next-themes** - Theme management

### Form Management
- **react-hook-form 7.62.0** - Form handling
- **@hookform/resolvers 5.2.1** - Form validation
- **zod 4.1.1** - Schema validation

### Utilities
- **dayjs 1.11.15** - Date formatting
- **clsx** - Conditional classnames
- **tailwind-merge** - Tailwind class merging
- **class-variance-authority** - Component variants

## Browser Requirements
- Modern browser with WebRTC support (for voice functionality)
- Microphone access permission
- Stable internet connection (minimum 1 Mbps for voice calls)

## Firestore Security Rules (Recommended)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /interviews/{interviewId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    match /feedback/{feedbackId} {
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
      allow write: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

## Troubleshooting

### Common Issues

1. **Firebase Authentication Error**
   - Verify all Firebase credentials in `.env.local`
   - Ensure Email/Password provider is enabled in Firebase Console
   - Check that private key has proper line breaks (`\n`)

2. **VAPI Connection Issues**
   - Verify VAPI tokens are correct
   - Check browser microphone permissions
   - Ensure stable internet connection

3. **Build Errors**
   - Clear `.next` folder: `rm -rf .next` (or `rmdir /s /q .next` on Windows)
   - Delete `node_modules` and reinstall: `npm install`
   - Check Node.js version compatibility

4. **Firestore Permission Denied**
   - Update Firestore security rules
   - Verify user is authenticated
   - Check collection names match code

## Support & Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [VAPI Documentation](https://docs.vapi.ai/)
- [Google AI Documentation](https://ai.google.dev/docs)
