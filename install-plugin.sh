#!/bin/bash

#############################################
# Bewerbungstrainer WordPress Plugin Installer
#############################################

echo "====================================="
echo "Bewerbungstrainer Plugin Installer"
echo "====================================="
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed"
    echo "Please install Node.js and npm first: https://nodejs.org/"
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Error: npm install failed"
    exit 1
fi

echo ""
echo "🏗️  Building React app..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Error: Build failed"
    exit 1
fi

echo ""
echo "✅ Build successful!"
echo ""
echo "📂 Next steps:"
echo "1. Copy this entire directory to: wp-content/plugins/bewerbungstrainer/"
echo "2. Activate the plugin in WordPress"
echo "3. Configure API keys (ElevenLabs & Gemini)"
echo "4. Create pages with shortcodes:"
echo "   - [bewerbungstrainer_interview]"
echo "   - [bewerbungstrainer_uebungen]"
echo ""
echo "📖 See README-WORDPRESS.md for detailed instructions"
echo ""
