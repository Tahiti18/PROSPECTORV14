# PROSPECTOR V14 - Lead Intelligence Engine

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

## 🚀 Overview

PROSPECTOR V14 is a high-performance B2B lead intelligence engine designed for AI transformation agencies. This system provides comprehensive lead discovery, analysis, and outreach automation powered by cutting-edge AI technology.

**Version:** 14.2.0 (STABLE)

## 🔑 API Configuration

This application uses TWO distinct APIs:

### 1. OpenRouter API (Text Intelligence)
- **Purpose:** ALL text-based AI operations (lead analysis, content generation, strategic planning)
- **Model:** STRICTLY Gemini 2.0 Flash (NO PRO models)
- **Get API Key:** [OpenRouter Dashboard](https://openrouter.ai/keys)
- **Environment Variable:** `OPENROUTER_API_KEY`

### 2. KIE API (Audio/Video Generation)
- **Purpose:** Audio and video generation features
- **Get API Key:** [KIE.AI Platform](https://kie.ai)
- **Environment Variable:** `KIE_API_KEY`

### ⚠️ IMPORTANT: NO GOOGLE APIs
This application does **NOT** use Google's Gemini API directly. All AI operations go through OpenRouter for complete independence from Google services.

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **OpenRouter API Key** (required for AI features)
- **KIE API Key** (required for audio/video features)

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/Tahiti18/PROSPECTORV14.git
cd PROSPECTORV14
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure API Keys
Create a `.env` file in the root directory:

```bash
# OpenRouter API Key (for Gemini Flash ONLY)
OPENROUTER_API_KEY=your_openrouter_api_key_here

# KIE API Key (for Audio/Video generation)
KIE_API_KEY=your_kie_api_key_here
```

**Never commit your `.env` file to version control!** It's already in `.gitignore`.

### 4. Run the Application

**Development Mode:**
```bash
npm run dev
```

**Build for Production:**
```bash
npm run build
```

**Preview Production Build:**
```bash
npm run preview
```

**Production Server (Railway/Render):**
```bash
npm start
```

## 🌐 Access URLs

- **Local Development:** http://localhost:5173
- **Production:** [Configure your deployment URL]

## 🎯 Core Features

### OPERATE Mode
- **Mission Control:** Central command dashboard with real-time analytics
- **Radar Recon:** AI-powered lead discovery system
- **Auto Crawl:** Automated prospect identification
- **Target List:** Lead management and scoring
- **War Room:** Deep dive lead analysis workspace
- **Pipeline:** Visual sales pipeline management
- **Heatmap:** Geographic lead distribution
- **Deep Logic:** Advanced business intelligence
- **Benchmark:** Competitive analysis engine

### CREATE Mode
- **Visual Studio:** AI-powered design generation
- **Mockups 4K:** Professional mockup creation
- **Product Synth:** Product visualization
- **Flash Spark:** Quick creative concepts
- **Media Vault:** Asset management system
- **Brand DNA:** Brand identity extraction

### STUDIO Mode
- **Video Pitch:** AI video generation (via KIE API)
- **Cinema Intel:** Video intelligence analysis
- **Motion Lab:** Motion graphics concepts
- **Sonic Studio:** Audio generation (via KIE API)
- **Live Scribe:** Real-time transcription

### SELL Mode
- **Business Orchestrator:** Complete sales automation
- **Proposals:** AI-generated proposals
- **ROI Calculator:** Business case generator
- **Deck Arch:** Presentation builder
- **Sequencer:** Multi-touch outreach campaigns

### CONTROL Mode
- **Playbook:** Strategic frameworks
- **Analytics Hub:** Performance metrics
- **Export Data:** Lead data export
- **Settings:** System configuration
- **Nexus Graph:** Relationship mapping

## 📊 Data Models

### Lead Structure
```typescript
{
  id: string;
  businessName: string;
  websiteUrl: string;
  niche: string;
  city: string;
  leadScore: number;
  assetGrade: 'A' | 'B' | 'C';
  socialGap: string;
  brandIdentity?: BrandIdentity;
  outreachStatus?: OutreachStatus;
  // ... additional fields
}
```

### Storage
- **LocalStorage:** Lead data, user preferences, session state
- **SessionStorage:** Asset cache, production logs
- **IndexedDB:** Future expansion for larger datasets

## 🔧 Technology Stack

- **Frontend:** React 19, TypeScript
- **Styling:** TailwindCSS
- **Build:** Vite 6
- **AI:** OpenRouter API (Gemini 2.0 Flash)
- **Media:** KIE API (Audio/Video generation)
- **State Management:** React Hooks, Local Storage

## 🚦 Development Guidelines

### Code Structure
```
webapp/
├── src/
├── components/
│   ├── workspaces/     # Feature modules
│   ├── common/         # Shared UI components
│   └── automation/     # Automation features
├── services/
│   ├── geminiService.ts    # AI service (OpenRouter)
│   ├── kieSunoService.ts   # Audio/Video service (KIE)
│   └── automation/         # Background services
├── types.ts            # TypeScript definitions
├── App.tsx             # Main application
└── vite.config.ts      # Build configuration
```

### API Usage Guidelines

**OpenRouter (Text AI):**
- Used for ALL text generation
- Used for ALL strategic analysis
- Used for ALL content creation
- Model: `google/gemini-2.0-flash-exp:free`
- Temperature: 0.3 (consistent, focused outputs)

**KIE (Media Generation):**
- Used ONLY for audio generation
- Used ONLY for video generation
- Proxied through `/api/kie/suno` endpoint
- Supports Suno V4.5 music model

## 🎨 UI Layouts

- **ZENITH:** Modern glassmorphic design (default)
- **COMMAND:** Terminal-style interface
- **CLASSIC:** Traditional sidebar layout

## 📱 Deployment

### Environment Variables (Production)
```bash
OPENROUTER_API_KEY=your_key
KIE_API_KEY=your_key
PORT=5173
```

### Supported Platforms
- Railway
- Render
- Vercel
- Netlify
- Any Node.js hosting

## 🔒 Security

- API keys stored in environment variables
- No keys in source code or git
- CORS enabled for API routes
- Input validation on all user data

## 📈 Performance

- Lazy loading for workspace modules
- Optimized bundle size with Vite
- Asset caching in browser storage
- Efficient re-rendering with React 19

## 🐛 Troubleshooting

### API Key Errors
```
Error: OPENROUTER_API_KEY is not configured
```
**Solution:** Create `.env` file with your OpenRouter API key

### Build Errors
```
Error: Module not found
```
**Solution:** Run `npm install` to install dependencies

### Port Already in Use
```
Error: Port 5173 is already in use
```
**Solution:** Kill the process or use a different port: `PORT=3000 npm run dev`

## 📝 Changelog

### Version 14.2.0 (Current)
- ✅ Migrated to OpenRouter API (Gemini Flash only)
- ✅ Removed all Google API dependencies
- ✅ Integrated KIE API for audio/video
- ✅ Enhanced Brand DNA extraction
- ✅ Improved automation system
- ✅ Added comprehensive error handling

## 🤝 Contributing

This is a private repository. For feature requests or bug reports, please contact the project maintainer.

## 📄 License

Proprietary - All Rights Reserved

## 🔗 Links

- **AI Studio:** https://ai.studio/apps/drive/1r40RcVb7qNSNfzZ0KhY3wunFPa_v9CrJ
- **GitHub:** https://github.com/Tahiti18/PROSPECTORV14
- **OpenRouter:** https://openrouter.ai
- **KIE AI:** https://kie.ai

## 📞 Support

For technical support or questions, please open an issue on GitHub.

---

**Built with ❤️ for B2B Sales Teams**

**SYSTEM STATUS: ONLINE**  
**VERSION: 14.2.0 (STABLE)**
