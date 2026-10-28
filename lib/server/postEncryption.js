import { pbkdf2Sync, randomBytes, createCipheriv } from 'node:crypto'

/**
 * Static exports have no unlock API, so a protected article ships only as
 * ciphertext and is decrypted in the browser (lib/utils/postDecryption.js).
 * Same idea as hexo-blog-encrypt / StatiCrypt:
 *   https://github.com/D0n9X1n/hexo-blog-encrypt
 *   https://github.com/robinmoisson/staticrypt
 * Key = PBKDF2-SHA256(sha256hex(password), salt), cipher = AES-256-GCM.
 * Only the stored sha256 hex digest is needed at build time, never the
 * plaintext password, and neither ends up in the output.
 */
export const POST_KDF_ITERATIONS = 600000

/** Legacy md5(slug + password) digests cannot be derived with WebCrypto. */
export function canEncryptPost(passwordDigest) {
  return /^[a-f0-9]{64}$/.test(String(passwordDigest || '').trim().toLowerCase())
}

export function encryptPostPayload(payload, passwordDigest) {
  const salt = randomBytes(16)
  const iv = randomBytes(12)
  const key = pbkdf2Sync(
    String(passwordDigest).trim().toLowerCase(),
    salt,
    POST_KDF_ITERATIONS,
    32,
    'sha256'
  )
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const data = Buffer.concat([
    cipher.update(JSON.stringify(payload), 'utf8'),
    cipher.final(),
    // WebCrypto expects the GCM tag appended to the ciphertext.
    cipher.getAuthTag()
  ])
  return {
    v: 1,
    iter: POST_KDF_ITERATIONS,
    salt: salt.toString('base64'),
    iv: iv.toString('base64'),
    data: data.toString('base64')
  }
}
