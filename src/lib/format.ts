export const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`
export const num = (n: number) => n.toLocaleString('en-IN')

const parseDay = (s: string) => (/^\d{4}-\d{2}-\d{2}/.test(s) && s.length === 10 ? new Date(`${s}T00:00:00`) : new Date(s))

export const fmtDate = (s: string) =>
  parseDay(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

export function daysLeft(s: string) {
  return Math.max(0, Math.ceil((new Date(s).getTime() - Date.now()) / 86_400_000))
}

export function greeting(name: string, now = new Date()) {
  const h = now.getHours()
  const part = h < 5 ? 'Good night' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  const first = name.trim().split(/\s+/)[0]
  return first ? `${part}, ${first[0].toUpperCase()}${first.slice(1)}` : part
}
