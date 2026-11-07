# Constellation Lyrics

A custom [Spicetify](https://spicetify.app) app that shows synced lyrics in two styles:

- **Constellation** – words appear as stars across the screen, linked by shooting-star trails, with a camera that zooms on choruses.
- **Flow** – the full lyrics scroll smoothly and each word fills letter by letter in time with the singer.

## Features
- Lyrics from Spotify, LRCLIB, lrcmux, Better Lyrics, NetEase, LrcApi, Musixmatch or a custom URL
- Word-level sync where the source provides it, with a smoothed playback clock
- Many backgrounds: album blur, galaxies, artist themes, ASCII scenes, autonomous worlds
- Background brightness and dim controls
- Flow animations: Glow, Wave, Pop, Rise, Soft fill, with size, glow, scroll and blur controls
- Performance profiles for low-RAM machines

## Install
1. Install Spicetify and make sure it works.
2. Copy this folder to your Spicetify `CustomApps` directory:
   - Windows: `%appdata%\spicetify\CustomApps\constellation-lyrics`
   - Linux/macOS: `~/.config/spicetify/CustomApps/constellation-lyrics`
3. Run:
   ```
   spicetify config custom_apps constellation-lyrics
   spicetify apply
   ```
4. Open **Constellation** from the Spotify sidebar, then **Settings → Style** to pick a lyric style.

## Controls
- `F` – fullscreen
- `[` / `]` – shift lyric timing by 0.05 s

## Credits
The letter-by-letter sync idea is inspired by [Liquid Lyrics](https://github.com/NMWplays/Liquid-Lyrics) (AGPL-3.0); the code here was written independently.
