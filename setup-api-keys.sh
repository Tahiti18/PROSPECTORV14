#!/bin/bash

# PROSPECTOR V14 - API Configuration Setup Script
# This script helps you configure your API keys safely

set -e

echo "🚀 PROSPECTOR V14 - API Configuration Setup"
echo "==========================================="
echo ""

# Check if .env exists
if [ -f .env ]; then
    echo "⚠️  .env file already exists!"
    read -p "Do you want to overwrite it? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Setup cancelled. Keeping existing .env file."
        exit 0
    fi
fi

echo "📝 Let's configure your API keys..."
echo ""

# OpenRouter API Key
echo "1️⃣  OpenRouter API Key (Required for AI features)"
echo "   Get your key at: https://openrouter.ai/keys"
echo ""
read -p "   Enter your OpenRouter API Key: " OPENROUTER_KEY

# KIE API Key
echo ""
echo "2️⃣  KIE API Key (Required for Audio/Video features)"
echo "   Get your key at: https://kie.ai"
echo ""
read -p "   Enter your KIE API Key: " KIE_KEY

# Create .env file
cat > .env << EOF
# OpenRouter API Key (for Gemini Flash ONLY)
OPENROUTER_API_KEY=${OPENROUTER_KEY}

# KIE API Key (for Audio/Video generation)
KIE_API_KEY=${KIE_KEY}
EOF

echo ""
echo "✅ Configuration saved to .env file!"
echo ""
echo "🔒 Security Notes:"
echo "   - Your .env file is in .gitignore (won't be committed)"
echo "   - Never share your API keys publicly"
echo "   - Keep your .env file secure"
echo ""
echo "📦 Next Steps:"
echo "   1. Install dependencies: npm install"
echo "   2. Start development server: npm run dev"
echo "   3. Or build for production: npm run build"
echo ""
echo "🌐 The app will be available at: http://localhost:5173"
echo ""
echo "✨ Setup complete! You're ready to go."
