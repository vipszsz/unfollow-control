/// <reference types="vite/client" />

interface UcBridge {
  platform: string
  openExternal(url: string): void
  minimize(): void
  toggleMaximize(): void
  close(): void
  instagramLogout(): Promise<void>
  onMaximized(cb: (maximized: boolean) => void): () => void
}

interface Window {
  /** Present only inside the Electron app; undefined in a plain browser. */
  uc?: UcBridge
}
