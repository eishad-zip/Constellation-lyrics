# Constellation Lyrics (Optimized Edition)

Updated Spicetify Custom App featuring:
- **Removed**: ASCII Knight, ASCII Cosmos, and Autonomous engine (cleaned ~80KB of heavy SDF/raymarch bloat).
- **Flow Lyric Instrumental Animation**: Minimal Apple Music-style audio wave pill between lines when an instrumental break occurs.
- **Gemini AI Generative Background**: Uses Gemini 2.5 Flash to analyze genre, mood, and aesthetic of any song and generate custom fluid canvas backgrounds (with local smart classifier fallback).
- **Apple-Style UI**: Translucent frosted glass top pill bar and Settings sheet with iOS-style segmented controls and switches.
- **Dismiss on Background Touch**: Tapping or clicking outside the Settings or Music Drawer immediately closes them.
- **Queue & Saved Music Window**: Browse upcoming tracks and search through your Liked Songs with one-click play.

---

## Files Provided
- `index.js`: Main Spicetify Custom App script.
- `style.css`: Apple-style frosted glass UI and minimal instrumental animation styles.
- `manifest.json`: Spicetify app manifest.

## How to Test or Install (When You Are Ready)
Copy the 3 files into your Spicetify CustomApps directory:
```powershell
Copy-Item -Path ".\*" -Destination "$env:APPDATA\spicetify\CustomApps\constellation\" -Recurse -Force
spicetify apply
```
