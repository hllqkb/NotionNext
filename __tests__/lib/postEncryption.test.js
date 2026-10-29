import { encryptPostPayload } from '@/lib/server/postEncryption'

const digest = 'a'.repeat(64)

// The browser keeps the derived key in localStorage, so it must survive a
// rebuild (same post, same password) and stop matching when either changes.
it('derives the same salt for a post across builds', () => {
  const first = encryptPostPayload({ n: 1 }, digest, 'post-1')
  const second = encryptPostPayload({ n: 1 }, digest, 'post-1')
  expect(second.salt).toBe(first.salt)
  expect(second.iv).not.toBe(first.iv)
  expect(encryptPostPayload({ n: 1 }, digest, 'post-2').salt).not.toBe(first.salt)
})
