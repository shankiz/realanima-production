# Anime Character Chat Application

A modern, responsive web application that allows users to have voice and text conversations with anime characters. The application uses Next.js for the frontend and backend, shadcn/ui for the UI components, and integrates with Fish.Audio for TTS/STT and Google Gemini for AI responses.

## Technical Stack

- **Frontend**: Next.js 14+ (App Router), React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, MongoDB (with Mongoose)
- **Authentication**: NextAuth.js with JWT and MongoDB adapter
- **AI Services**:
  - Fish.Audio TTS (WebSocket for real-time voice generation)
  - Fish.Audio ASR (for speech-to-text)
  - Google Gemini AI (for character responses)
- **Payment Processing**: Stripe for subscription management
- **Deployment**: Vercel

## Core Features

- User Authentication System
- Subscription Tiers
- Character System
- Voice Conversation System
- Text Chat System
- Message Credit System
- Referral System

## Getting Started

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `/src/app` - Next.js App Router pages and layouts
- `/src/components` - UI components
- `/src/lib` - Utility functions and shared code
- `/src/models` - MongoDB models
- `/src/services` - External service integrations (Fish.Audio, Gemini)
