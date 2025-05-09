
# Refined-Voicetts

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
