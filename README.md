# Refined VoiceTTS

A voice-based AI conversation system with a sophisticated frontend and Python backend.

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend/chunking-test
```

2. Install required Python dependencies:
```bash
pip install -r requirements.txt
```

3. Start the backend WebSocket server:
```bash
python main.py
```

The backend will run on `ws://localhost:8080` and provide WebSocket-based communication for voice transcription, AI responses, and text-to-speech.

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install the required Node.js dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open the frontend in your browser:
```
http://localhost:3000
```

## Usage

1. Navigate to the call page by clicking "Start Call" on the home page
2. Allow microphone access when prompted
3. Click "Start Call" on the call page to begin the conversation
4. Talk to the AI and receive voice responses

## Technical Details

- Frontend: Next.js with TypeScript and Tailwind CSS
- Backend: Python using WebSockets, Groq API, and XTTS for text-to-speech
- Communication: WebSocket protocol for real-time bidirectional communication
- Voice Recognition: Browser's built-in SpeechRecognition API and Groq's Whisper API
- Text-to-Speech: XTTS model for high-quality voice synthesis

## Troubleshooting

- Ensure the backend is running before starting a call from the frontend
- Check console logs for any WebSocket connection errors
- Make sure your browser supports the SpeechRecognition API (Chrome, Edge recommended)
- Allow microphone access permissions

## ✅ Required Dependencies (Before Installing)

```bash
apt-get install ffmpeg
apt-get install nano
apt-get install lsof
apt-get update && apt-get install -y portaudio19-dev
```

---

## 🌐 Ngrok Setup

```bash
wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
tar -xvzf ngrok-*.tgz
mv ngrok /usr/local/bin/

ngrok config add-authtoken 2tRF97F44GEew0tB2SmsbdBd0oE_5ishCYb1ScjaqZFXVbN4t
ngrok http --hostname=early-guiding-feline.ngrok-free.app 8080
```

> 💡 **Run `ngrok` in a split terminal session.**

---

## 💻 Frontend Setup

After cloning the repository:

```bash
cd frontend
npm install 
npm run build
npm run dev
```

> ⚠️ If you get an error related to Next.js:

```bash
npm install next
```

---

## 🖥️ Backend Setup

```bash
cd backend
cd chunking-test

# Create a virtual environment
python -m venv myenv          # or use: python3 -m venv myenv

# Activate the virtual environment
source myenv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the backend
python main.py
```

> ✅ **Ensure the virtual environment is created and activated before running `main.py`.**

---

## 🔀 Split Terminal using tmux

```bash
sudo apt-get install tmux
tmux
```

### Inside `tmux`:

- Press `Ctrl + B`, then `%` to split the terminal vertically.
- Use the arrow keys to navigate between panes.

---
