# 🗣️ Thanjavur Marathi Translator

> *Preserving the voice of Thanjavur Marathi—one word, one phrase, one connection at a time.*

A modern, interactive web application for **translating English into Thanjavur Marathi** (Tanjore Marathi / Dakshini Marathi) with voice input, family tree visualization, cultural recipes, and community resources. Built by and for people who want to speak, learn, and celebrate this rich linguistic heritage.

---

## ✨ Features

### 🎤 **Smart Translation Engine**
- Translate English words, phrases, and full sentences into Thanjavur Marathi
- View **Devanagari** and **romanized** versions instantly
- Context-aware register selection (elder respectful, young male, young female)
- Powered by hand-curated language database scraped from linguistic blogs

### 👨‍👩‍👧‍👦 **Interactive Family Tree**
- Visualize kinship relations in Thanjavur Marathi culture
- Explore how family members are named and addressed across generations
- Click nodes to see detailed relationship information

### 🍳 **Traditional Cookbook**
- Discover authentic Thanjavur Marathi recipes with cultural context
- Browse ingredient lists and preparation methods
- Learn food vocabulary in the target language

### 💭 **Emotions & Expressions**
- Explore emotional vocabulary and idiomatic expressions
- Understand how feelings are articulated in Thanjavur Marathi
- Discover character traits and personality descriptions

### 🔊 **Voice Input**
- Speak English phrases and hear translations
- Built on browser-native Web Speech API (no external API required)
- Real-time transcription and translation

### 🌍 **Community & Resources**
- Connect with fellow learners and speakers
- Discover cultural ceremonies and traditions (e.g., marriage customs)
- Access curated learning materials

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | React 18 + Vite |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS + PostCSS |
| **Voice** | Web Speech API (browser-native) |
| **Data** | Static JSON databases (bundled) |
| **Scripts** | Node.js + TypeScript utilities |
| **ML Pipeline** | Hugging Face dataset export (optional) |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm/yarn
- Modern browser with Web Speech API support

### Installation & Development

```bash
# Clone the repository
git clone https://github.com/vasudhasampratik-pixel/Thanjavur_Marathi.git
cd Thanjavur_Marathi

# Install dependencies
npm install

# Start development server
npm run dev
```

The app opens at `http://localhost:5173` with hot module reloading.

### Build for Production

```bash
npm run build
npm run preview  # Test production build locally
```

### Authentication Setup

1. Create a Firebase project at https://console.firebase.google.com.
2. Enable **Google** and **Email/Password** Authentication in the Firebase Authentication settings.
3. Add your app's web origin to Firebase authorized domains.
4. Copy `.env.example` to `.env.local` and fill in the Firebase config values.
5. Install the new dependency:

```bash
npm install
```

With this setup, the app will require sign-in with Google or email/password before showing content.

#### Firebase Dynamic Links shutdown note

Firebase Dynamic Links shutdown affects these auth flows:
- Email link authentication for mobile apps
- Cordova OAuth support for web apps

Current app status:
- Uses Google OAuth and email/password
- Does not use email-link authentication

If you package this web app in a native wrapper (for example Cordova/Capacitor), do not depend on Firebase web OAuth redirect/popup inside the in-app webview. Prefer one of these paths:
1. Keep email/password enabled for wrapped builds.
2. For Google on mobile, use native provider sign-in in the wrapper and exchange credentials with Firebase.
3. Open sign-in in the system browser instead of embedded webview.

### Publishing to Android / iOS

This app now includes Firebase authentication and can be packaged for Android and iOS using a web-to-native wrapper such as Capacitor, or by turning the site into a PWA and then using a native wrapper.

Steps:
1. Install dependencies: `npm install`
2. Create `.env.local` from `.env.example` and fill in your Firebase values.
3. Build production assets: `npm run build`
4. Add Capacitor or another wrapper, then generate Android/iOS native projects.

For full store publishing, follow the Play Store and App Store submission guides after you have built the native wrapper.

### GitHub Pages Deployment

```bash
npm install
npm run deploy
```

To use your custom domain, add your domain name in the GitHub Pages repository settings or place a `CNAME` file containing it in the `public/` folder before building.

---

## 📁 Project Structure

```
src/
├── components/          # React UI components
│   ├── TranslatorBox    # Main translation interface
│   ├── FeedbackPanel    # User feedback collection
│   ├── TabBar           # Navigation tabs
│   └── familytree/      # Family tree visualization
├── pages/               # Full-page components
│   ├── VaraadPage       # (Main translator page)
│   ├── FamilyTreePage   # Kinship relations
│   ├── EmotionsPage     # Emotional vocabulary
│   ├── CookBookPage     # Recipes & food culture
│   └── CommunityPage    # Community resources
├── hooks/               # React hooks
│   ├── useTranslate     # Translation logic
│   └── useSpeechInput   # Voice input handling
├── data/                # Databases & datasets
│   ├── dictionary.json              # Core language database
│   ├── app_dictionary.json          # App-specific vocabulary
│   ├── cookbook_recipes.json        # Recipes
│   ├── emotions.ts & relations.ts   # Emotional & kinship data
│   └── processed/                   # ML training datasets
└── utils/               # Helper functions
    ├── learnedTranslator.ts         # Smart lookup & inference
    ├── sentenceRules.ts             # Grammar & sentence patterns
    └── search.ts                    # Full-text search

scripts/
├── scraper.ts           # Blog scraper for dictionary
├── scrape-cookbook.ts   # Recipe scraper
├── prepare-training-data.ts      # ML dataset preparation
├── export-hf-dataset.ts          # Export to Hugging Face
├── append-feedback.ts   # Collect user corrections
└── feedback-server.ts   # Feedback collection server
```

---

## 📚 Scripts

```bash
# Scrape language data from source blogs
npm run scrape

# Scrape cookbook recipes
npm run scrape:cookbook

# Prepare training data for ML models
npm run data:prepare

# Retrieve similar sentences/phrases
npm run retrieve

# Export dataset to Hugging Face format
npm run data:export:hf
```

---

## 🌱 How It Works

### 1. **Language Database**
- Scraped from [tanjoremarathis.blogspot.com](https://tanjoremarathis.blogspot.com)
- Hand-curated entries with multiple variants (Devanagari + romanized)
- Organized by domain: common words, emotions, food, relations, etc.

### 2. **Translation Pipeline**
1. User enters English text
2. Fuzzy-match against dictionary + ML-learned patterns
3. Return best match with Devanagari & romanized versions
4. Respect context (formal/informal registers)

### 3. **Voice Input**
- Browser Web Speech API transcribes English
- Result fed to translator
- No external API costs

### 4. **Feedback Loop**
- Users can flag incorrect translations
- Feedback stored in `processed/feedback_gold.jsonl`
- Used to improve translation accuracy over time

---

## 🤝 Contributing

We welcome contributions! Whether you're a native speaker, linguist, developer, or cultural enthusiast:

- **Improve translations**: Review and correct dictionary entries
- **Add recipes**: Contribute traditional recipes with cultural stories
- **Expand features**: Voice output, offline mode, Marathi→English translation
- **Improve UI/UX**: Make the app more intuitive and accessible
- **Grow the community**: Share resources and learning materials

### Contributing Steps
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-idea`
3. Make changes and test locally
4. Submit a pull request with a clear description

---

## 📖 Language Notes

### Thanjavur Marathi (तञ्जावूर मराठी)

Thanjavur Marathi, spoken in Thanjavur (Tanjore), Tamil Nadu, is a distinct dialect of Marathi with:
- Unique phonology and vocabulary
- Different case systems and verb forms than Standard Marathi
- Rich cultural traditions (ceremonies, cuisine, kinship systems)
- Estimated 100K–200K speakers (endangered language)

This project aims to **document, preserve, and revitalize** this beautiful language.

---

## 🎯 Roadmap

- [ ] Marathi → English reverse translation
- [ ] Offline mode (PWA)
- [ ] Text-to-speech in Thanjavur Marathi
- [ ] Mobile app (React Native)
- [ ] ML-powered sentence generation
- [ ] Integration with academic linguistic tools
- [ ] Community contribution platform

---

## 📄 License

[Choose your license: MIT / GPL / Creative Commons / etc.]

---

## 🙏 Acknowledgments

- **Data Source**: [Tanjore Marathis Blog](https://tanjoremarathis.blogspot.com)
- **Language Preservationists**: Scholars and speakers who maintain Thanjavur Marathi heritage
- **Community Contributors**: Every translation, recipe, and story counts

---

## 💬 Get In Touch

- **Issues & Feature Requests**: [GitHub Issues](https://github.com/vasudhasampratik-pixel/Thanjavur_Marathi/issues)
- **Discussions**: [GitHub Discussions](https://github.com/vasudhasampratik-pixel/Thanjavur_Marathi/discussions)
- **Email**: [Your contact info]

---

**Made with ❤️ to keep Thanjavur Marathi alive.**
