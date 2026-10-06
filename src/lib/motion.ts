import type { Transition } from 'motion/react'

// Apple defaults (apple-design skill): critically damped for UI that just appears,
// a little bounce only when a gesture carried momentum.
export const SPRING: Transition = { type: 'spring', bounce: 0, duration: 0.3 }
export const SPRING_SLOW: Transition = { type: 'spring', bounce: 0, duration: 0.5 }
export const SPRING_FLICK: Transition = { type: 'spring', bounce: 0.2, duration: 0.4 }
