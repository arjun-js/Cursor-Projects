export function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

export function formatTime24(date: Date): string {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

export function parseHHmm(hhmm: string): { h: number; m: number } | null {
  const m = /^(\d{2}):(\d{2})$/.exec(hhmm)
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  if (!Number.isFinite(h) || !Number.isFinite(min)) return null
  if (h < 0 || h > 23 || min < 0 || min > 59) return null
  return { h, m: min }
}

export function nextOccurrenceMs(hhmm: string, now = new Date()): number | null {
  const parsed = parseHHmm(hhmm)
  if (!parsed) return null
  const candidate = new Date(now)
  candidate.setSeconds(0, 0)
  candidate.setHours(parsed.h, parsed.m, 0, 0)
  if (candidate.getTime() <= now.getTime()) {
    candidate.setDate(candidate.getDate() + 1)
  }
  return candidate.getTime()
}

