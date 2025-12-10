# ProffMaster - MBBS Question Bank

AI-Powered Quiz & Analytics App for Medical Students.

## Features

- 📚 Comprehensive question bank covering all MBBS subjects
- 🤖 AI-generated quizzes using OpenRouter API
- 📊 Performance analytics and progress tracking
- 🔖 Bookmark questions for review
- 📱 Cross-platform (Web + Android via Capacitor)

## Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env.local` file with your credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_key
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

### Building for Android

1. Build the web app:
   ```bash
   npm run build
   ```

2. Sync with Capacitor:
   ```bash
   npx cap sync android
   ```

3. Open in Android Studio or build APK:
   ```bash
   cd android && ./gradlew assembleDebug
   ```
