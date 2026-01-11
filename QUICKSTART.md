# PROSPECTOR V14 - Quick Start Guide

## 🚀 Getting Started in 3 Minutes

### Step 1: Get Your API Keys

#### OpenRouter API Key (Required)
1. Visit: https://openrouter.ai/keys
2. Sign up or log in
3. Click "Create Key"
4. Copy your API key
5. **Model Used:** `google/gemini-2.0-flash-exp:free` (NO PRO models)

#### KIE API Key (Required for Audio/Video)
1. Visit: https://kie.ai
2. Sign up or log in
3. Navigate to API settings
4. Copy your API key

### Step 2: Configure the Application

**Option A: Use the Setup Script (Recommended)**
```bash
./setup-api-keys.sh
```

**Option B: Manual Configuration**
```bash
# Create .env file
cat > .env << 'EOF'
# OpenRouter API Key (for Gemini Flash ONLY)
OPENROUTER_API_KEY=your_openrouter_key_here

# KIE API Key (for Audio/Video generation)
KIE_API_KEY=your_kie_key_here
EOF
```

### Step 3: Install & Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Or start with PM2 (recommended for production-like testing)
pm2 start ecosystem.config.cjs
```

**Access the app at:** http://localhost:5173

## 🔍 Verify Your Setup

### Test OpenRouter Connection
1. Navigate to "OPERATE" → "RADAR RECON"
2. Try generating leads
3. If successful, OpenRouter is working ✅

### Test KIE Connection
1. Navigate to "STUDIO" → "SONIC STUDIO"
2. Try generating audio
3. If successful, KIE is working ✅

## 🐛 Common Issues

### Issue: "OPENROUTER_API_KEY is not configured"
**Solution:** Check your `.env` file exists and has the correct key

### Issue: "KIE Proxy Error"
**Solution:** Verify your KIE_API_KEY in `.env` file

### Issue: Port 5173 already in use
**Solution:** 
```bash
# Kill existing process
fuser -k 5173/tcp

# Or use different port
PORT=3000 npm run dev
```

## 📚 Key Features by Mode

### OPERATE (Lead Intelligence)
- **Radar Recon:** Find leads with AI
- **Target List:** Manage prospects
- **War Room:** Deep analysis
- **Pipeline:** Track progress

### CREATE (Content Generation)
- **Visual Studio:** Design concepts
- **Brand DNA:** Extract brand identity
- **Flash Spark:** Quick hooks

### STUDIO (Media Production)
- **Video Pitch:** AI video (KIE)
- **Sonic Studio:** AI audio (KIE)
- **Motion Lab:** Motion concepts

### SELL (Sales Automation)
- **Business Orchestrator:** Full campaigns
- **Proposals:** AI proposals
- **ROI Calculator:** Business cases

### CONTROL (System Management)
- **Analytics Hub:** Performance
- **Export Data:** Data export
- **Settings:** Configuration

## 🎯 First Actions

1. **Set Theater:** Click location dropdown → Enter your target city
2. **Generate Leads:** OPERATE → RADAR RECON → Enter niche → Generate
3. **Analyze Lead:** TARGET LIST → Click lead → WAR ROOM
4. **Create Campaign:** SELL → BUSINESS ORCHESTRATOR

## 📖 Documentation

- Full README: `README.md`
- API Documentation: See OpenRouter and KIE docs
- Type Definitions: `types.ts`

## 🆘 Need Help?

- Check the main README.md for detailed documentation
- Review error messages in browser console
- Verify API keys are correct and active
- Check network tab for API call failures

## 🔐 Security Reminders

- ✅ `.env` file is in `.gitignore`
- ✅ Never commit API keys
- ✅ Keep keys secure
- ✅ Rotate keys if compromised

---

**You're all set! Start discovering leads with PROSPECTOR V14** 🎯
