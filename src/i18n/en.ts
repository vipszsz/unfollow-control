import type { Dict } from './pt'

export const en: Dict = {
  appName: 'Unfollow Control',
  win: { close: 'Close', minimize: 'Minimize', maximize: 'Maximize', restore: 'Restore' },
  nav: {
    notFollowingBack: 'Not following back',
    mutuals: 'Mutuals',
    fans: 'Fans',
    pending: 'Pending',
  },
  actions: {
    import: 'Import zip',
    history: 'History',
    swipe: 'Swipe mode',
    search: 'Search @account…',
    more: 'More options',
  },
  theme: { label: 'Theme', light: 'Light', dark: 'Dark' },
  lang: { label: 'Language' },
  locked: 'Import a zip to unlock',
  soon: 'soon',
  menu: {
    howTo: 'How to export from Instagram',
    github: 'Code on GitHub',
    wipe: 'Delete all data',
    wipeHint: 'Nothing saved yet',
  },
  welcome: {
    eyebrow: 'private · local · no login',
    title: 'Who doesn’t follow you back?',
    body: 'Import Instagram’s official export to see who doesn’t follow you back, who’s mutual and which requests are still pending. Nothing leaves your computer.',
    drop: 'Drop your Instagram zip here',
    dropHint: 'or click to choose the file',
    howTo: 'No zip yet? See how to export',
  },
  privacy: {
    noLogin: { title: 'No login', body: 'You never type your password. The app only reads the file Instagram itself gives you.' },
    offline: { title: 'No internet', body: 'The app is blocked from the network. Profiles open in your own browser.' },
    local: { title: 'Only on your PC', body: 'Your data stays in the app’s folder. Delete everything whenever you want.' },
  },
}
