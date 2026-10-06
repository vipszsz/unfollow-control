// The export has no profile pictures, so each account gets a stable gradient from its username.
const GRADIENTS = [
  ['#4a63ff', '#8b5cf6'],
  ['#14b8a6', '#3b82f6'],
  ['#f59e0b', '#f43f5e'],
  ['#10b981', '#14b8a6'],
  ['#8b5cf6', '#ec4899'],
  ['#3b82f6', '#06b6d4'],
  ['#f43f5e', '#8b5cf6'],
]

function hash(s: string) {
  let h = 0
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return h
}

export function Avatar({ username, size = 36, muted }: { username: string; size?: number; muted?: boolean }) {
  const [a, b] = muted ? ['#4b5060', '#30333d'] : GRADIENTS[hash(username) % GRADIENTS.length]
  const letter = muted ? '?' : (username.replace(/[^a-z0-9]/gi, '')[0] ?? '@')
  return (
    <span
      className="avatar"
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: size * 0.4, background: `linear-gradient(135deg, ${a}, ${b})` }}
    >
      {letter}
    </span>
  )
}
