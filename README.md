# Unfollow Control

See who doesn't follow you back on Instagram, using Instagram's own data export. No login, no internet: the app only reads the zip you download from Instagram, and it is blocked from making any network request.

> Work in progress. Phase 3 (list mode) of 6.

## Privacy

- **No login.** You never type your Instagram password into the app.
- **No internet.** Every network request from the app is cancelled (`electron/main.cjs`). Profile links open in your own browser.
- **Only on your PC.** Data stays in the app's folder. You can delete everything from the app.

## Development

```bash
npm install
npm run dev      # Electron app with hot reload
npm run dev:web  # UI only, in the browser
npm run build    # typecheck + production build
```
