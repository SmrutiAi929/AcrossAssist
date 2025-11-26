# HMS Voice Agent - Multimodal Live API Web Console

![HMS Voice Agent](readme/thumbnail.png)

A sophisticated AI-powered voice agent for **HMS Mirdif Hospital** appointment booking system. Built with Google's Gemini Multimodal Live API, this application provides real-time voice interaction with intelligent data capture capabilities for seamless hospital appointment management.

## 🌟 Overview

The HMS Voice Agent is a production-ready voice interface that enables patients to book hospital appointments through natural conversation. The agent intelligently captures appointment details, validates information against the hospital's doctor directory, and provides a comprehensive data collection center for monitoring and managing bookings.

### Key Capabilities

- **🎤 Real-time Voice Interaction**: Bidirectional audio streaming with Google's Gemini 2.5 Flash model
- **🌍 Multilingual Support**: English, Hindi, and Emirati Arabic (UAE dialect)
- **📊 Intelligent Data Capture**: Tool-based function calling for structured data extraction
- **👨‍⚕️ Doctor Directory Integration**: Pre-configured with HMS Mirdif Hospital's medical staff
- **📈 Live Data Collection Center**: Real-time visualization of captured appointment information
- **🔒 HTTPS/SSL Ready**: Production deployment with nginx reverse proxy support

---

## 🎯 Features

### 1. **AI-Powered Conversational Interface**
- Natural language understanding for appointment booking
- Context-aware responses with conversational flow
- Automatic greeting in English with language switching capability
- Female voice (Aoede) with Indian English accent

### 2. **Intelligent Data Capture Tool**
The application uses Google's function calling feature to capture structured appointment data:
- **Department**: Medical specialty selection
- **Doctor**: Validated against hospital directory
- **Patient Name**: Full name capture
- **Mobile Number**: Contact information
- **Appointment Date & Time**: Flexible date/time parsing

### 3. **Data Collection Center**
Real-time dashboard showing:
- ✅ Live capture status for each data field
- 📊 Appointment completion progress (0-100%)
- ⏱️ Call duration tracking
- 💾 JSON export functionality
- 🎨 Visual status indicators (Pending/Collected)

### 4. **HMS Mirdif Hospital Doctor Directory**
Pre-configured with 20+ medical departments including:
- Cardiology
- Neurology & Neurosurgery
- Orthopedics & Trauma Surgery (7 doctors)
- Internal Medicine & General Medicine
- Oncology & Hematology
- Pulmonology & Respiratory Medicine
- Gastroenterology & Hepatology
- And many more...

### 5. **Multi-Language Support**
- **English**: Default language
- **Hindi**: Full conversation support
- **Arabic (Emirati)**: UAE-specific dialect only

---

## 🛠️ Tech Stack

### Frontend
- **React 18.3.1**: Modern UI framework
- **TypeScript 5.6.3**: Type-safe development
- **SASS 1.80.6**: Advanced styling
- **React Icons 5.3.0**: Icon library
- **Zustand 5.0.1**: State management

### Backend/API
- **Google Gemini 2.5 Flash**: AI model with native audio support
- **@google/genai 0.14.0**: Official Gemini SDK
- **WebSocket**: Real-time bidirectional communication
- **EventEmitter3 5.0.1**: Event-driven architecture

### Additional Libraries
- **classnames**: Dynamic CSS classes
- **lodash**: Utility functions
- **dotenv-flow**: Environment management
- **vega/vega-lite**: Data visualization (optional)

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v16.x or higher (v18.x recommended)
- **npm**: v7.x or higher
- **Google Gemini API Key**: [Get one here](https://aistudio.google.com/apikey)
- **Modern Browser**: Chrome, Firefox, Safari, or Edge with WebSocket support

### For Production Deployment
- **nginx**: For reverse proxy and SSL termination
- **certbot**: For SSL certificate management
- **tmux** (optional): For persistent background processes
- **Linux Server**: Ubuntu 20.04+ or similar

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd gemini-hms
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- React and React DOM
- Google GenAI SDK
- TypeScript and build tools
- All UI libraries and utilities

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit the `.env` file and add your Gemini API key:

```env
REACT_APP_GEMINI_API_KEY=your_gemini_api_key_here
```

**Important**: Never commit your `.env` file to version control!

### 4. Start Development Server

```bash
npm start
```

The application will open automatically at `http://localhost:3002`

---

## ⚙️ Configuration

### Port Configuration

The default port is **3002**. To change it, edit `package.json`:

```json
{
  "scripts": {
    "start": "cross-env PORT=3002 react-scripts start"
  }
}
```

### Voice Configuration

The AI uses the "Aoede" female voice. To change, edit `src/App.tsx`:

```typescript
speechConfig: {
  voiceConfig: {
    prebuiltVoiceConfig: {
      voiceName: "Aoede", // Options: Aoede, Charon, Fenrir, Kore, Puck
    },
  },
}
```

### System Instructions

Customize the AI's behavior by editing the system instruction in `src/App.tsx` (lines 98-214).

---

## 📖 Usage

### Starting the Application

1. **Connect**: Click the "Connect" button at the bottom
2. **Wait for Greeting**: The AI will say "Welcome to HMS Mirdif Hospital, what can I do for you?"
3. **Speak Naturally**: Tell the AI what you need (e.g., "I need an orthopedic appointment")
4. **Watch Data Capture**: See the Data Collection Center update in real-time

### Example Conversation

```
User: "I need a cardiology appointment"
AI: "Great! I can help you book a Cardiology consultation. Which doctor would you prefer to see?"
📊 [Department: Cardiology] - Captured

User: "Dr. Ghassan Nouh"
AI: "Excellent choice. Dr. Ghassan Nouh is our Consultant Interventional Cardiologist. May I have your name please?"
📊 [Doctor: Dr. Ghassan Nouh] - Captured

User: "John Smith"
AI: "Thank you, John. May I have your mobile number to confirm your appointment?"
📊 [Patient Name: John Smith] - Captured

User: "0501234567"
AI: "Got it. When would you like to schedule your appointment?"
📊 [Mobile Number: 0501234567] - Captured

User: "Tomorrow at 10 AM"
AI: "Perfect! Let me confirm your appointment details..."
📊 [Appointment Date & Time: Tomorrow at 10 AM] - Captured
```

### Language Switching

- **Default**: English
- **Switch to Hindi**: Say "Hindi" or "Can we speak in Hindi?"
- **Switch to Arabic**: Say "Arabic" or "عربي"

### Downloading Captured Data

1. Wait for data to be captured (fields show "Collected")
2. Click the "Download" button in the Data Collection Progress section
3. A JSON file will be downloaded with all captured information

Example JSON output:
```json
{
  "department": "Cardiology",
  "doctor": "Dr. Ghassan Nouh",
  "patientName": "John Smith",
  "mobileNumber": "0501234567",
  "appointmentDateTime": "Tomorrow at 10 AM",
  "capturedAt": "2025-11-24T05:00:00.000Z",
  "completionPercentage": "100%",
  "callDuration": "2:45"
}
```

---

## 🏗️ Architecture

### Component Structure

```
src/
├── App.tsx                          # Main application component
├── contexts/
│   └── LiveAPIContext.tsx           # WebSocket & API context
├── components/
│   ├── hms-header/                  # Header with language/scenario selector
│   ├── transcript/                  # Conversation transcript display
│   ├── data-collection-center/      # Data capture dashboard
│   ├── bottom-toolbar/              # Audio controls
│   └── control-tray/                # Settings and controls
├── agents/
│   └── sampleData.ts                # HMS doctor directory
├── lib/
│   ├── genai-live-client.ts         # WebSocket client wrapper
│   └── utils.ts                     # Utility functions
└── types.ts                         # TypeScript definitions
```

### Data Flow

```
User Speaks → Browser Microphone → WebSocket → Gemini API
                                                     ↓
                                            AI Processing
                                                     ↓
                                          Tool Call Triggered
                                                     ↓
                                    capture_appointment_data()
                                                     ↓
                                         React State Updated
                                                     ↓
                                   UI Auto-Updates (Real-time)
                                                     ↓
                           Data Collection Center Shows Status
```

### Function Tool Definition

The data capture tool is defined as:

```typescript
const captureAppointmentDataTool: FunctionDeclaration = {
  name: "capture_appointment_data",
  description: "Captures and stores appointment booking details during the conversation.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      department: { type: Type.STRING, description: "Medical department" },
      doctor: { type: Type.STRING, description: "Doctor's full name" },
      patientName: { type: Type.STRING, description: "Patient's full name" },
      mobileNumber: { type: Type.STRING, description: "Mobile phone number" },
      appointmentDateTime: { type: Type.STRING, description: "Appointment date and time" }
    }
  }
};
```

---

## 🏥 Customizing the Hospital Directory

### Adding New Doctors

Edit `src/agents/sampleData.ts`:

```typescript
{
  department: 'Orthopedics & Trauma Surgery',
  doctors: [
    'Dr Ahmed Samy — Consultant Orthopedic Surgeon and Sports Medicine',
    'Dr Hani Eltair — Consultant Trauma & Orthopedic Surgeon',
    'Dr Jinwoo An — Consultant Orthopedic Surgeon',
    // Add your new doctor here
    'Dr New Doctor — Specialist Title',
  ],
}
```

### Adding New Departments

```typescript
export const hmsDepartmentDirectory: HmsDepartment[] = [
  // ... existing departments
  {
    department: 'Your New Department',
    doctors: [
      'Dr Name — Title',
      'Dr Another Name — Title',
    ],
  },
];
```

**Note**: After updating the directory, restart the application for changes to take effect.

---

## 🚀 Production Deployment

### Using nginx + Certbot + tmux

#### 1. nginx Configuration

Create `/etc/nginx/sites-available/your-domain`:

```nginx
upstream nextjs_upstream_hms {
    server 127.0.0.1:3002;
}

server {
    listen 80;
    server_name your-domain.com;

    # WebSocket support
    location / {
        proxy_pass http://nextjs_upstream_hms;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Audio streaming optimizations
        proxy_buffering off;
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }

    # Static files caching
    location /_next/static {
        proxy_pass http://nextjs_upstream_hms;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/your-domain /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 2. SSL Certificate with Certbot

```bash
sudo certbot --nginx -d your-domain.com
```

Certbot will automatically configure HTTPS and set up auto-renewal.

#### 3. Running with tmux

```bash
# Create a new tmux session
tmux new-session -d -s hms-voice-agent "cd /path/to/gemini-hms && npm start"

# View the session
tmux attach -t hms-voice-agent

# Detach from session: Ctrl+B then D

# Kill session
tmux kill-session -t hms-voice-agent
```

#### 4. Process Management

```bash
# Check if application is running
ss -tuln | grep 3002

# View logs
tmux attach -t hms-voice-agent

# Restart application
tmux kill-session -t hms-voice-agent
tmux new-session -d -s hms-voice-agent "cd /path/to/gemini-hms && npm start"
```

---

## 🔧 Development

### Available Scripts

#### `npm start`
Runs the app in development mode on port 3002.
Hot-reload enabled for instant development feedback.

#### `npm run build`
Creates an optimized production build in the `build/` folder.
Minified and optimized for performance.

#### `npm test`
Launches the test runner in interactive watch mode.

#### `npm run eject`
⚠️ **One-way operation!** Ejects from Create React App for full control.

### Project Structure Best Practices

- **Components**: Keep components small and focused
- **State Management**: Use Zustand for complex state, Context API for simple sharing
- **Styling**: Use SCSS modules for component-specific styles
- **Types**: Define all TypeScript interfaces in `types.ts` or component files
- **Utilities**: Place reusable functions in `lib/utils.ts`

### Adding New Features

1. Create feature branch: `git checkout -b feature/your-feature`
2. Implement changes with TypeScript types
3. Test thoroughly in development
4. Update this README if needed
5. Create pull request

---

## 🐛 Troubleshooting

### Common Issues

#### 1. API Key Error
```
Error: set REACT_APP_GEMINI_API_KEY in .env
```
**Solution**: Create `.env` file with valid Gemini API key

#### 2. Port Already in Use
```
Error: Port 3002 is already in use
```
**Solution**: 
```bash
# Find process using port
sudo lsof -i :3002
# Kill the process
kill -9 <PID>
# Or change port in package.json
```

#### 3. WebSocket Connection Failed
**Symptoms**: "Connect" button doesn't work, no AI response

**Solutions**:
- Check internet connection
- Verify API key is valid
- Check browser console for errors
- Ensure nginx WebSocket support is configured

#### 4. No Audio Input/Output
**Solutions**:
- Grant microphone permissions in browser
- Check browser audio settings
- Verify "Audio playback" checkbox is enabled
- Test with different browser

#### 5. Data Not Capturing
**Symptoms**: Fields stay "Pending" during conversation

**Solutions**:
- Check browser console for tool call logs
- Verify AI is following system instructions
- Ensure conversation includes relevant appointment details
- Check that `capture_appointment_data` tool is properly configured in `App.tsx`

#### 6. Deployment Issues
**nginx 502 Bad Gateway**:
```bash
# Check if application is running
ss -tuln | grep 3002
# Check nginx logs
sudo tail -f /var/log/nginx/error.log
# Verify proxy_pass URL is correct
```

### Debug Mode

Enable detailed logging in browser console:

```typescript
// In src/App.tsx
console.log("Tool call received:", toolCall);
console.log("Capturing appointment data:", captureCall.args);
```

---

## 📊 Performance Optimization

### Recommended Settings

- **Connection**: Stable broadband (10+ Mbps)
- **Browser**: Chrome/Edge for best WebRTC support
- **Codec**: Opus (48 kHz) - default, best quality
- **Server**: 2+ CPU cores, 4GB+ RAM for production

### Reducing Latency

1. Use nearest Google Cloud region
2. Enable HTTP/2 in nginx
3. Optimize network settings:
```nginx
tcp_nodelay on;
tcp_nopush off;
keepalive_timeout 65;
```

---

## 🔐 Security Considerations

### API Key Security
- ✅ **Never** commit `.env` files
- ✅ Use environment variables in production
- ✅ Rotate API keys regularly
- ✅ Set up API quotas in Google Cloud Console

### Production Checklist
- ✅ Enable HTTPS/SSL
- ✅ Configure CORS properly
- ✅ Set up rate limiting
- ✅ Enable nginx security headers
- ✅ Regular security updates

---

## 📝 License

This project is based on Google's Multimodal Live API Web Console.

_This is an experiment showcasing the Live API, not an official Google product. We'll do our best to support and maintain this experiment but your mileage may vary. We encourage open sourcing projects as a way of learning from each other. Please respect our and other creators' rights, including copyright and trademark rights when present, when sharing these works and creating derivative work._

For more info on Google's policy: [Google Terms of Service](https://developers.google.com/terms/site-policies)

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Standards
- Use TypeScript for all new code
- Follow React best practices
- Add comments for complex logic
- Update README for new features
- Test thoroughly before submitting

---

## 📞 Support

### Resources
- [Google Gemini API Documentation](https://ai.google.dev/gemini-api)
- [Multimodal Live API Guide](https://ai.google.dev/gemini-api/docs/live-guide)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

### Getting Help
1. Check this README and troubleshooting section
2. Search existing issues in the repository
3. Create a new issue with detailed description
4. Include logs, error messages, and steps to reproduce

---

## 🎉 Acknowledgments

- Google Gemini Team for the Multimodal Live API
- HMS Mirdif Hospital for the use case and doctor directory
- React and TypeScript communities
- All contributors and users of this project

---

## 📈 Version History

### v1.0.0 (Current)
- ✅ Initial release
- ✅ Real-time voice interaction
- ✅ Tool-based data capture
- ✅ HMS doctor directory integration
- ✅ Multi-language support (English, Hindi, Emirati Arabic)
- ✅ Data Collection Center dashboard
- ✅ Production deployment ready

### Roadmap
- [ ] Video support for visual consultations
- [ ] Integration with hospital booking system
- [ ] SMS/Email confirmation
- [ ] Multi-agent handoff support
- [ ] Advanced analytics dashboard
- [ ] Patient authentication

---

**Built with ❤️ using Google Gemini Multimodal Live API**

**Production URL**: https://beeidea.pragyaa.ai  
**Port**: 3002  
**Status**: ✅ Live and Running
