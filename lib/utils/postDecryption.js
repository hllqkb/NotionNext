/** Browser counterpart of lib/server/postEncryption.js. */
const KEY_PREFIX = 'post_key_'

const fromBase64 = value => Uint8Array.from(atob(value), c => c.charCodeAt(0))
const toBase64 = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes)))

async function deriveKey(password, encrypted) {
  const subtle = window.crypto.subtle
  const digest = await subtle.digest('SHA-256', new TextEncoder().encode(password))
  const hex = [...new Uint8Array(digest)]
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  const material = await subtle.importKey(
    'raw',
    new TextEncoder().encode(hex),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  return subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: fromBase64(encrypted.salt), iterations: encrypted.iter },
    material,
    256
  )
}

async function decryptWithRawKey(rawKey, encrypted) {
  const key = await window.crypto.subtle.importKey('raw', rawKey, 'AES-GCM', false, ['decrypt'])
  const plain = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(encrypted.iv) },
    key,
    fromBase64(encrypted.data)
  )
  return JSON.parse(new TextDecoder().decode(plain))
}

/** Returns the payload, or null when the password is wrong (GCM tag mismatch). */
export async function decryptPost(password, encrypted, postId) {
  const rawKey = await deriveKey(password, encrypted)
  let payload
  try {
    payload = await decryptWithRawKey(rawKey, encrypted)
  } catch (error) {
    if (error?.name === 'OperationError') return null
    throw error
  }
  // Remember the derived key (not the password) until the tab is closed.
  try {
    sessionStorage.setItem(KEY_PREFIX + postId, toBase64(rawKey))
  } catch {
    /* Storage may be disabled. */
  }
  return payload
}

export async function decryptPostWithSavedKey(encrypted, postId) {
  let saved = null
  try {
    saved = sessionStorage.getItem(KEY_PREFIX + postId)
  } catch {
    return null
  }
  if (!saved) return null
  try {
    return await decryptWithRawKey(fromBase64(saved), encrypted)
  } catch {
    // The password changed since the key was saved.
    try {
      sessionStorage.removeItem(KEY_PREFIX + postId)
    } catch {
      /* ignore */
    }
    return null
  }
}
