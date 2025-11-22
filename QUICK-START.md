# Quick Start Guide

## 🚀 Get Up and Running in 5 Minutes

### Prerequisites
- Node.js (v16+)
- npm or yarn
- Google Gemini API Key

### Installation

```bash
# 1. Clone repository
git clone <repository-url>
cd live-api-web-console

# 2. Install dependencies
npm install

# 3. Create .env file with your API key
# Windows (PowerShell):
"REACT_APP_GEMINI_API_KEY=your_actual_api_key" | Out-File -FilePath .env -Encoding ASCII

# macOS/Linux:
echo "REACT_APP_GEMINI_API_KEY=your_actual_api_key" > .env

# 4. Start the application
npm start
```

### Get Your API Key

1. Go to https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and paste it in your `.env` file

### Access the Application

Once started, open your browser to:
```
http://localhost:8084
```

---

## 📋 Common Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install all dependencies |
| `npm start` | Start development server (port 8084) |
| `npm run build` | Create production build |
| `npm test` | Run tests |
| `npm run start-https` | Start with HTTPS |

---

## 🔧 Troubleshooting

### Can't install packages?
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### API key not working?
1. Check `.env` file exists in root directory
2. Variable name must be exactly `REACT_APP_GEMINI_API_KEY`
3. Restart server after changing `.env`

### Port already in use?
Change port in `package.json`:
```json
"start": "cross-env PORT=3000 react-scripts start"
```

---

## 📚 Full Documentation

For detailed setup instructions, see `SETUP.md`

