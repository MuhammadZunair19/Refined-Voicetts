# Integration Summary

This document summarizes the changes made to integrate the Python backend with the Next.js frontend.

## Changes Made

1. **Updated WebSocket URL in the frontend**
   - Changed the WebSocket connection URL in `frontend/lib/api.ts` to point to the local Python backend server (`ws://localhost:8080`)

2. **Updated Script Type Configuration**
   - Modified the default script type in `frontend/components/voice-call.tsx` to "truck_dispatch" to match the backend's BPO_SCRIPTS configuration
   - Updated the script type descriptions to match the backend's purpose

3. **Improved User Interface Text**
   - Updated the call page to correctly inform users that they'll be interacting with a Truck Dispatcher AI

4. **Documentation**
   - Created a comprehensive README with setup and usage instructions
   - Ensured all dependencies are properly documented

## How It Works

1. The Python backend (`backend/chunking-test/main.py`) runs a WebSocket server on port 8080
2. The frontend connects to this WebSocket server when a user initiates a call
3. Audio from the user's microphone is sent to the backend for processing
4. The backend:
   - Transcribes the audio using Groq's Whisper API
   - Processes the text with the Groq LLM using the Truck Dispatcher script
   - Generates speech from the LLM response using XTTS
   - Sends audio chunks back to the frontend
5. The frontend plays the audio response and continues the conversation

## Testing the Integration

1. Start the backend server:
   ```bash
   cd backend/chunking-test
   python main.py
   ```

2. Start the frontend development server:
   ```bash
   cd frontend
   npm run dev
   ```

3. Open your browser to http://localhost:3000 and navigate to the call page
4. Start a conversation with the AI by clicking the "Start Call" button
5. The system will automatically establish a WebSocket connection, process your voice, and respond with AI-generated speech

## Troubleshooting

- Check browser console for WebSocket connection errors
- Ensure the Python backend is running and accessible on port 8080
- Verify that all required Python packages are installed
- Make sure your microphone permissions are enabled in the browser 