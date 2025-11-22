# HMS Live API Web Console - Setup Guide

This guide will help you set up and run the HMS Live API Web Console project after cloning it from the repository.

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (v16 or higher)
  - Download from: https://nodejs.org/
  - Verify installation: `node --version`
  
- **npm** (comes with Node.js) or **yarn**
  - Verify installation: `npm --version`
  
- **Git**
  - Download from: https://git-scm.com/
  - Verify installation: `git --version`

- **Google Gemini API Key**
  - Get your API key from: https://aistudio.google.com/app/apikey
  - See `GET-API-KEY.md` for detailed instructions

## 🚀 Installation Steps

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd live-api-web-console
```

### Step 2: Install Dependencies

Using npm:
```bash
npm install
```

Or using yarn:
```bash
yarn install
```

This will install all required dependencies including:
- React 18.3.1
- TypeScript 5.6.3
- @google/genai (Google Generative AI SDK)
- Sass for styling
- React Icons
- Zustand for state management
- And other dependencies listed in `package.json`

### Step 3: Configure Environment Variables

Create a `.env` file in the root directory of the project:

```bash
# On Windows (PowerShell)
New-Item .env

# On macOS/Linux
touch .env
```

Add the following content to the `.env` file:

```env
# Google Gemini API Key (REQUIRED)
REACT_APP_GEMINI_API_KEY=your_gemini_api_key_here
```

**⚠️ IMPORTANT:** Replace `your_gemini_api_key_here` with your actual Gemini API key.

**Security Note:** 
- Never commit the `.env` file to version control
- The `.env` file should already be in `.gitignore`
- Keep your API key secure and don't share it publicly

### Step 4: Verify Installation

Check if everything is set up correctly:

```bash
npm run build
```

If there are no errors, you're ready to run the application!

## ▶️ Running the Application

### Development Mode

Start the development server:

```bash
npm start
```

This will:
- Start the application on `http://localhost:8084`
- Automatically open your browser
- Enable hot-reload (changes will reflect automatically)

### HTTPS Mode (Optional)

If you need to run with HTTPS:

```bash
npm run start-https
```

### Production Build

To create an optimized production build:

```bash
npm run build
```

The build output will be in the `build/` directory.

## 🧪 Testing

Run tests:

```bash
npm test
```

## 📁 Project Structure

```
live-api-web-console/
├── public/                 # Static files
├── src/
│   ├── agents/            # Sample data and configurations
│   ├── components/        # React components
│   │   ├── data-collection-center/
│   │   ├── hms-header/
│   │   ├── transcript/
│   │   └── ...
│   ├── contexts/          # React contexts (LiveAPIContext)
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility libraries
│   ├── App.tsx            # Main application component
│   ├── App.scss           # Main styles
│   └── index.tsx          # Entry point
├── .env                   # Environment variables (create this)
├── package.json           # Project dependencies
├── tsconfig.json          # TypeScript configuration
└── README.md             # Project documentation
```

## ⚙️ Configuration

### Port Configuration

The application runs on port 8084 by default. To change the port:

1. Open `package.json`
2. Modify the start script:
   ```json
   "start": "cross-env PORT=YOUR_PORT react-scripts start"
   ```

### Audio Configuration

For detailed audio setup and microphone configuration, see `AUDIO-CONFIGURATION.md`.

## 🔧 Troubleshooting

### Common Issues

#### 1. **"Module not found" errors**
```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

#### 2. **API Key not working**
- Verify the API key is correct in `.env`
- Ensure the variable name is exactly `REACT_APP_GEMINI_API_KEY`
- Restart the development server after changing `.env`

#### 3. **Port already in use**
```bash
# Kill the process using port 8084
# Windows:
netstat -ano | findstr :8084
taskkill /PID <PID> /F

# macOS/Linux:
lsof -ti:8084 | xargs kill -9
```

#### 4. **TypeScript errors**
```bash
# Clear TypeScript cache
rm -rf node_modules/.cache
npm start
```

#### 5. **Build fails**
```bash
# Clear cache and rebuild
npm run build -- --no-cache
```

### Audio/Microphone Issues

If you're experiencing audio problems:
1. Check browser permissions for microphone access
2. Ensure you're using a supported browser (Chrome, Edge, or Firefox)
3. See `AUDIO-CONFIGURATION.md` for detailed troubleshooting

## 🌐 Browser Compatibility

Recommended browsers:
- Google Chrome (latest)
- Microsoft Edge (latest)
- Mozilla Firefox (latest)
- Safari (latest) - limited support

**Note:** The application uses Web APIs that may not be fully supported in older browsers.

## 📚 Additional Documentation

- **API Key Setup:** See `GET-API-KEY.md`
- **Contributing:** See `CONTRIBUTING.md`
- **Audio Setup:** See `AUDIO-CONFIGURATION.md`

## 🔐 Security Best Practices

1. **Never commit** `.env` file to version control
2. **Rotate API keys** regularly
3. **Use environment variables** for all sensitive data
4. **Review** `.gitignore` to ensure secrets are excluded

## 🛠️ Development Tools

### Recommended VS Code Extensions

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript and JavaScript Language Features** - TS support
- **Sass** - SCSS syntax highlighting

### Useful npm Scripts

```bash
npm start          # Start development server
npm run build      # Create production build
npm test           # Run tests
npm run eject      # Eject from create-react-app (⚠️ irreversible)
```

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review existing documentation files
3. Check the browser console for error messages
4. Ensure all prerequisites are installed correctly

## 📄 License

See the LICENSE file for details.

---

## Quick Start Summary

```bash
# 1. Clone the repository
git clone <repository-url>
cd live-api-web-console

# 2. Install dependencies
npm install

# 3. Create .env file
echo "REACT_APP_GEMINI_API_KEY=your_api_key_here" > .env

# 4. Start the application
npm start
```

🎉 **You're all set!** The application should now be running on http://localhost:8084

