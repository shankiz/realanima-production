# Anime Character Chat - Replit Deployment Guide

## Overview
This guide will help you deploy the Anime Character Chat application on Replit. The application is a Next.js project that allows users to chat with anime characters using AI.

## Prerequisites
- A Replit account
- MongoDB Atlas account (already configured)
- Google Gemini API key (already configured)
- Fish.Audio API key (already configured)
- Xendit account for payment processing

## Deployment Steps

### 1. Create a New Repl
- Go to [Replit](https://replit.com)
- Click on "Create Repl"
- Select "Import from GitHub" or choose "Node.js" as the template
- Name your repl "anime-character-chat" or any name you prefer

### 2. Upload the Code
- Upload the provided zip file to your Repl
- Extract the contents to the root directory of your Repl

### 3. Configure Environment Variables
The `.env.local` file has been pre-configured with your provided API keys:
- MongoDB URI
- Google Gemini API key
- Fish.Audio API key

You'll need to add your Xendit API keys once you have them.

### 4. Install Dependencies
Run the following command in the Replit shell:
```bash
npm install
```

### 5. Build the Application
```bash
npm run build
```

### 6. Start the Application
```bash
npm start
```

### 7. Configure Replit for Always-On (Optional)
If you have Replit Pro, you can enable the "Always On" feature to keep your application running continuously.

## Xendit Integration
To complete the Xendit integration:
1. Sign up for a Xendit account
2. Get your API keys from the Xendit dashboard
3. Update the `.env.local` file with your Xendit API keys
4. Configure webhook endpoints in your Xendit dashboard to point to your Replit URL + `/api/subscription/webhook`

## Troubleshooting
- If you encounter any issues with the build, try running `npm run dev` first to check for errors
- Make sure all environment variables are correctly set
- Check the Replit logs for any error messages

## Additional Configuration
- To enable social login, update the OAuth provider credentials in the `.env.local` file
- To customize the characters, modify the `src/services/CharacterContexts.ts` file

## Support
If you need any assistance with the deployment, please reach out for support.
