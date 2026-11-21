const FIRST_DELAY_MS = 30_000
const MAX_DELAY_MS = 3_600_000

export const EMPTY_PRIVATE_PAGE_THROTTLE = { failures: 0, lockedUntil: 0 }

// This only slows down attempts through the form. Anyone can download the
// ciphertext and try passwords offline without this limit.
export function recordPrivatePageFailure(throttle, now) {
  const failures = throttle.failures + 1
  const delay = failures < 5
    ? 0
    : Math.min(MAX_DELAY_MS, FIRST_DELAY_MS * 2 ** (failures - 5))
  return { failures, lockedUntil: delay ? now + delay : 0 }
}

export function privatePageSecondsRemaining(throttle, now) {
  return Math.max(0, Math.ceil((throttle.lockedUntil - now) / 1000))
}
