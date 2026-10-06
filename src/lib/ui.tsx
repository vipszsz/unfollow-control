import { createContext, useContext } from 'react'

export interface UI {
  openGuide(): void
  openWipe(): void
}

export const UIContext = createContext<UI>({ openGuide() {}, openWipe() {} })
export const useUI = () => useContext(UIContext)
