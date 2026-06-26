# CSW24 Scrabble Tournament Trainer - PWA

A comprehensive Scrabble study app for learning rare and high-scoring words from the Collins Scrabble Words 2024 (CSW24) dictionary.

Built with **Vite + React** and animated with **framer-motion**.

## 🛠️ Development

```bash
npm install      # install dependencies
npm run dev      # start dev server (hot reload) at http://localhost:5173
npm run build    # produce a static, self-contained build in dist/
npm run preview  # serve the production build locally
```

### Project structure
```
index.html              # Vite entry
src/
  main.jsx              # app bootstrap + service-worker registration
  App.jsx               # screen routing + game state
  components/           # SetupScreen, StudyScreen, QuizScreen, ResultsScreen, Shared
  lib/db.js            # IndexedDB progress persistence
  lib/quiz.js          # Scrabble scoring + quiz generators
public/                 # words-data.json, manifest.json, service-worker.js
```

`npm run build` outputs a fully static `dist/` (no CDN/runtime dependencies), so
it works completely offline and can be AirDropped to an iPad and opened directly.

## 📱 Installation on iPad

1. **Extract the ZIP file** to any folder on your computer
2. **Transfer files to iPad** using:
   - AirDrop
   - iCloud Drive
   - Email attachment
   - Cloud storage (Google Drive, Dropbox, OneDrive)
3. **Open in Safari** on iPad
4. **Install as App**:
   - Tap the Share button (↑)
   - Select "Add to Home Screen"
   - Name it "Scrabble Trainer"
   - Tap "Add"
5. **Open from Home Screen** - it now works like a native app!

## 📦 File Contents

- `index.html` - Main app (React + UI)
- `manifest.json` - PWA configuration
- `service-worker.js` - Offline support & caching
- `words-data.json` - 290+ CSW24 words with definitions
- `README.md` - This file

## 🎮 Features

### Study Mode
- Browse words at your pace
- See definitions, example sentences, point values
- Mark words as "Learned"
- Customizable word selection (2-letter, 3-letter, 4-letter, or mix)

### Quiz Mode - 4 Question Types
1. **Fill the Gap** - Complete a sentence by picking the right word
2. **Complete the Word** - Given blanks and definition, type the word
3. **Guess the Meaning** - Word shown, pick the correct definition
4. **Meaning to Word** - Definition shown, pick the correct word

### Progress Tracking
- **Mastered** - Words you've learned successfully
- **Needs Practice** - Words you got wrong
- **Total Progress** - Track % of words mastered
- **Session Score** - Points earned in each quiz session

### Smart Learning
- System prioritizes:
  1. Words you need to practice
  2. Rare high-scoring words
  3. Q-without-U words
  4. Premium letter combinations (J, X, Z)

### Offline Support
- Works completely offline once loaded
- Progress saves locally on your device
- No internet required after first use

## 🚀 Usage Tips

### Starting a Session
1. Select word length mix (2-letter, 3-letter, etc. or all)
2. Enter number of questions (15, 20, 30, etc.)
3. Choose mode:
   - **Study Mode**: Learn at your own pace
   - **Quiz Mode**: Test yourself with mixed questions

### Tournament Strategy Focus
- **2-letter words**: Master these first (game-changers)
- **3-letter rare**: Focus on high-value combos (J, X, Z, K)
- **4-letter premium**: Learn high-value rare words
- **Q-without-U**: Essential tournament wildcards (QI, QOPH, WAQF, etc.)

### Updating Words
To add new words to `words-data.json`:
```json
{
  "word": "ABC",
  "length": 3,
  "points": 8,
  "definition": "Brief definition",
  "exampleSentence": "Use it in a sentence.",
  "group": "3-Letter Common",
  "rarity": "rare",
  "difficulty": "hard"
}
```

## 💾 Data Storage

- All progress saves to your device (IndexedDB)
- No cloud sync (privacy-first)
- Data persists between sessions
- Clear Safari cache only if you want to reset progress

## ⚙️ System Requirements

- iPad with Safari browser
- iOS 11.0 or later
- Minimum 50MB free space
- No internet required after loading

## 🎯 Tournament Tips (CSW24)

1. **Master short words first** - 2-3 letter words unlock many plays
2. **Focus on premium combinations**:
   - J-words: JAI, JAK, JAP, JIZ, JOL, JOR, JUD (8-11 points)
   - X-words: DUX, EXO, HOX, NOX, TEX, WEX, WOX, YEX (10-20 points)
   - Z-words: ZEA, ZEX, ZHO, ZIZ, ZOL, ZOS (12-20 points)
3. **Q-without-U is crucial**: QIN, QOPH, QADI, FIQH, WAQF
4. **Vowel combinations open boards**: AA, AE, AI, AO, AU, EA, EE, etc.
5. **Study the new CSW24 additions**: YEET, BRUH, YAJI, STAN, etc.

## 📊 Your CSW24 Dictionary

This app includes:
- **18 two-letter words** (essential)
- **255+ three-letter words** (focus on rare high-scorers)
- **75+ four-letter premium words** (J, X, Z combos)
- **Q-without-U words** (tournament wildcards)
- All with Scrabble point values & definitions

## 🔧 Troubleshooting

**App not loading?**
- Check all files are in the same folder
- Ensure `words-data.json` is present
- Refresh Safari (swipe down)

**Progress not saving?**
- Check Safari settings (allow local storage)
- Don't clear cache while using the app

**Words not displaying?**
- Verify `words-data.json` format is valid JSON
- Try refreshing the page

## 📝 License & Attribution

- CSW24 word list: Collins Dictionary (official Scrabble words)
- App: Custom build for tournament preparation

## Good Luck! 🎯

Your tournament awaits. Master these words and dominate the board!
