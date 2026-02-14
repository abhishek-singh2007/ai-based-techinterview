# Design Documentation

## Project Architecture

### Technology Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4 with custom design system
- **Authentication**: Firebase Authentication
- **Database**: Firestore (NoSQL)
- **AI Services**: Google Gemini AI, VAPI Voice AI
- **UI Components**: Radix UI primitives with custom styling

## Application Structure

### Directory Organization

```
prepwise/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication routes (grouped)
│   │   ├── sign-in/
│   │   └── sign-up/
│   ├── (root)/                   # Main application routes (grouped)
│   │   ├── interview/
│   │   │   ├── [id]/            # Dynamic interview detail
│   │   │   │   └── feedback/    # Interview feedback page
│   │   │   └── page.tsx         # Interview generation
│   │   └── page.tsx             # Dashboard/Home
│   ├── api/                      # API routes
│   │   └── vapi/
│   │       └── generate/        # Interview generation endpoint
│   ├── layout.tsx               # Root layout
│   └── globals.css              # Global styles
├── components/                   # React components
│   ├── ui/                      # Reusable UI components
│   ├── Agent.tsx                # Voice AI agent component
│   ├── AuthForm.tsx             # Authentication form
│   ├── InterviewCard.tsx        # Interview display card
│   └── ...
├── firebase/                     # Firebase configuration
│   ├── admin.ts                 # Server-side Firebase
│   └── client.ts                # Client-side Firebase
├── lib/                         # Utility libraries
│   ├── actions/                 # Server actions
│   │   ├── auth.action.ts       # Authentication logic
│   │   └── general.action.ts    # General operations
│   ├── utils.ts                 # Helper functions
│   └── vapi.sdk.ts              # VAPI SDK initialization
├── types/                       # TypeScript definitions
│   ├── index.d.ts               # Global types
│   └── vapi.d.ts                # VAPI-specific types
├── constants/                   # Application constants
│   └── index.ts                 # Config, schemas, mappings
└── public/                      # Static assets
    ├── covers/                  # Interview cover images
    └── ...
```

## Design System

### Color Palette

#### Light Mode
- Background: `oklch(1 0 0)` - Pure white
- Foreground: `oklch(0.145 0 0)` - Near black
- Primary: `oklch(0.205 0 0)` - Dark gray
- Secondary: `oklch(0.97 0 0)` - Light gray

#### Dark Mode (Default)
- Background: `oklch(0.145 0 0)` - Dark background
- Foreground: `oklch(0.985 0 0)` - Near white
- Primary: `oklch(0.922 0 0)` - Light gray
- Card: `oklch(0.205 0 0)` - Dark card background

#### Custom Colors
- **Primary**: `#CAC5FE` (primary-200) - Purple accent
- **Success**: `#49de50` (success-100) - Green for call button
- **Destructive**: `#f75353` (destructive-100) - Red for disconnect
- **Light Shades**: Various opacity levels for text hierarchy

### Typography
- **Font Family**: Mona Sans (Google Font)
- **Headings**: 
  - h2: 3xl, font-semibold
  - h3: 2xl, font-semibold
- **Body**: Light-100 color for paragraphs
- **Lists**: Disc style with light-100 color

### Custom Utilities
- `dark-gradient`: Gradient from `#1A1C20` to `#08090D`
- `blue-gradient-dark`: Gradient from `#171532` to `#08090D`
- `border-gradient`: Gradient border effect
- `pattern`: Background pattern from `/pattern.png`
- `flex-center`: Flexbox centering utility

## Core Features

### 1. Authentication System
**Location**: `app/(auth)/`, `lib/actions/auth.action.ts`

**Flow**:
- User signs up with email/password via Firebase Auth
- User data stored in Firestore `users` collection
- Session managed via HTTP-only cookies (7-day duration)
- Server-side session verification using Firebase Admin SDK

**Components**:
- `AuthForm.tsx` - Handles both sign-in and sign-up
- Uses `react-hook-form` with Zod validation
- Toast notifications for user feedback

### 2. Interview Generation
**Location**: `app/(root)/interview/page.tsx`, `app/api/vapi/generate/route.ts`

**Flow**:
1. User interacts with VAPI voice assistant
2. User provides: role, experience level, tech stack, interview type, question count
3. Assistant sends data to `/api/vapi/generate` endpoint
4. Google Gemini AI generates interview questions
5. Interview saved to Firestore with metadata
6. User redirected to dashboard

**Data Structure**:
```typescript
{
  role: string,
  type: "Behavioral" | "Technical" | "Mixed",
  level: "Junior" | "Mid" | "Senior",
  techstack: string[],
  questions: string[],
  userId: string,
  finalized: boolean,
  coverImage: string,
  createdAt: string
}
```

### 3. Voice Interview Conductor
**Location**: `components/Agent.tsx`, `app/(root)/interview/[id]/page.tsx`

**Features**:
- Real-time voice conversation with AI interviewer
- Visual feedback (speaking animation)
- Live transcript display
- Call status management (Inactive → Connecting → Active → Finished)

**VAPI Integration**:
- Uses VAPI Web SDK for voice calls
- Custom interviewer configuration with GPT-4
- Deepgram for transcription
- ElevenLabs for voice synthesis

**Call Flow**:
1. User clicks "Call" button
2. VAPI establishes WebRTC connection
3. AI asks prepared questions sequentially
4. User responds via microphone
5. Transcript captured in real-time
6. User ends call or interview completes
7. Transcript sent for feedback generation

### 4. AI Feedback Generation
**Location**: `lib/actions/general.action.ts`

**Process**:
1. Interview transcript formatted for AI analysis
2. Google Gemini AI evaluates performance
3. Structured feedback generated using Zod schema
4. Feedback saved to Firestore

**Evaluation Categories** (0-100 scale):
- Communication Skills
- Technical Knowledge
- Problem Solving
- Cultural Fit
- Confidence and Clarity

**Feedback Structure**:
```typescript
{
  totalScore: number,
  categoryScores: Array<{
    name: string,
    score: number,
    comment: string
  }>,
  strengths: string[],
  areasForImprovement: string[],
  finalAssessment: string,
  createdAt: string
}
```

### 5. Dashboard
**Location**: `app/(root)/page.tsx`

**Sections**:
- **Hero CTA**: Encourages starting new interview
- **Your Interviews**: User's past interviews with scores
- **Take Interviews**: Available interviews from other users

**Features**:
- Interview cards with metadata
- Score display (if completed)
- Quick access to feedback or retake
- Date formatting with dayjs

### 6. Feedback Display
**Location**: `app/(root)/interview/[id]/feedback/page.tsx`

**Content**:
- Overall score with visual indicators
- Interview date and time
- Final assessment summary
- Category-wise breakdown with scores
- Strengths list
- Areas for improvement
- Action buttons (Dashboard, Retake)

## Component Architecture

### Reusable Components

#### Agent Component
**Purpose**: Manages voice AI interaction
**State Management**:
- `callStatus`: Tracks call lifecycle
- `messages`: Stores conversation transcript
- `isSpeaking`: Visual feedback for AI speech
- `lastMessage`: Displays most recent transcript

**Event Handlers**:
- `call-start`, `call-end`: Call lifecycle
- `message`: Transcript updates
- `speech-start`, `speech-end`: Speaking indicators
- `error`: Error handling

#### InterviewCard Component
**Purpose**: Displays interview summary
**Features**:
- Dynamic badge color based on type
- Tech stack icons with tooltips
- Score display (if available)
- Conditional CTA (View/Check Feedback)
- Random cover image assignment

#### AuthForm Component
**Purpose**: Handles authentication
**Features**:
- Dynamic form (sign-in/sign-up)
- Form validation with Zod
- Firebase integration
- Session cookie management
- Error handling with toast notifications

### UI Components (Radix-based)
- `Button`: Customizable button with variants
- `Form`: Form wrapper with context
- `Input`: Styled input field
- `Label`: Accessible label component
- `Sonner`: Toast notification system

## Data Flow

### Server Actions Pattern
Next.js Server Actions used for secure backend operations:
- `signUp()`, `signIn()`, `signOut()` - Authentication
- `getCurrentUser()` - Session verification
- `createFeedback()` - AI feedback generation
- `getInterviewById()` - Fetch interview data
- `getFeedbackByInterviewId()` - Fetch feedback
- `getLatestInterviews()` - Dashboard data
- `getInterviewsByUserId()` - User's interviews

### API Routes
- `POST /api/vapi/generate` - Interview generation with AI
- Uses Google Gemini for question generation
- Saves to Firestore with metadata

## Security Considerations

### Authentication
- HTTP-only cookies prevent XSS attacks
- Session cookies expire after 7 days
- Server-side verification on protected routes
- Firebase Admin SDK for secure operations

### Environment Variables
- Sensitive keys stored in `.env.local`
- Never committed to version control
- Server-only variables (no `NEXT_PUBLIC_` prefix for secrets)

### Firestore Access
- User-specific data isolation
- Server-side queries with authentication checks
- Recommended security rules for production

## Styling Architecture

### Tailwind Configuration
- Custom color system with CSS variables
- Dark mode as default
- Custom utilities for gradients and patterns
- Component-specific classes in `@layer components`

### Responsive Design
- Mobile-first approach
- Breakpoints: `sm`, `md`, `lg`, `xl`
- Flexible layouts with Flexbox/Grid
- Conditional rendering for mobile/desktop

### Animation
- Custom `fadeIn` animation for transcripts
- Pulse animation for speaking indicator
- Smooth transitions with Tailwind utilities
- CSS animations for call button

## Tech Stack Mapping
**Location**: `constants/index.ts`

Maps various tech name formats to standardized icons:
- Handles variations (e.g., "react.js", "reactjs", "react" → "react")
- Supports 60+ technologies
- Used for displaying tech stack icons

## Performance Optimizations

### Next.js Features
- App Router for improved performance
- Server Components by default
- Dynamic imports for code splitting
- Image optimization with `next/image`
- Turbopack for faster builds

### Caching Strategy
- Server-side data fetching
- Firestore queries optimized with indexes
- Static assets served from CDN

### Build Configuration
- ESLint and TypeScript errors ignored during build (for development)
- Production builds optimized automatically

## Future Enhancement Opportunities

1. **Resume Upload**: Allow users to upload resumes for personalized questions
2. **Video Recording**: Record interview sessions for self-review
3. **Analytics Dashboard**: Track progress over time
4. **Interview Scheduling**: Schedule interviews with reminders
5. **Peer Review**: Allow users to review each other's interviews
6. **Custom Question Banks**: Create personal question collections
7. **Multi-language Support**: Internationalization
8. **Mobile App**: React Native version
9. **Interview Templates**: Pre-built interview scenarios
10. **Company-specific Prep**: Targeted preparation for specific companies

## Design Principles

1. **User-Centric**: Simple, intuitive interface
2. **Accessibility**: Semantic HTML, ARIA labels, keyboard navigation
3. **Performance**: Fast load times, optimized assets
4. **Scalability**: Modular architecture, reusable components
5. **Security**: Best practices for authentication and data protection
6. **Maintainability**: Clean code, TypeScript for type safety
7. **Responsiveness**: Works seamlessly across devices
