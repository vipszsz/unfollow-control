# Unfollow Control

See who doesn't follow you back on Instagram, using Instagram's own data export, then work through them: list mode, a Tinder-style swipe mode, colored labels and an unfollow queue with Instagram's own site in a side panel.

> Work in progress. Phase 5 (history, daily goal, account lookup) of 6.

## Privacy

- **No login by the app.** The app never asks for your password. If you use the Instagram panel, you log in on Instagram's own page, and you click "Unfollow" yourself. Nothing is automated.
- **Only Instagram online.** Every network request from the app itself is cancelled (`electron/main.cjs`). The Instagram panel is a separate, sandboxed session that can only reach Instagram/Meta domains; the app never reads or scripts that page. "Log out of Instagram" deletes that session.
- **Only on your PC.** Data stays in the app's folder. You can delete everything from the app.

## Development

```bash
npm install
npm run dev      # Electron app with hot reload
npm run dev:web  # UI only, in the browser
npm run build    # typecheck + production build
```
