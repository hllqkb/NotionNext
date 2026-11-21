import Head from 'next/head'
import { useEffect, useRef, useState } from 'react'
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fetchGlobalAllData } from '@/lib/db/SiteDataApi'
import {
  EMPTY_PRIVATE_PAGE_THROTTLE,
  privatePageSecondsRemaining,
  recordPrivatePageFailure
} from '@/lib/privatePageThrottle'
import {
  decryptPost,
  decryptPostWithSavedKey,
  forgetPostKey
} from '@/lib/utils/postDecryption'
import { PageLink } from '@/themes/reading/components/Frame'
import PasswordForm from '@/themes/reading/components/PasswordForm'

const LOCKED_TITLE = '私密页面'
const POST_ID = 'private-pages'
const THROTTLE_KEY = 'private-pages-throttle'
const PRIVATE_JSON = /^([a-fA-F0-9]{16})\.json$/

function readThrottle(fallback) {
  try {
    const stored = JSON.parse(localStorage.getItem(THROTTLE_KEY))
    if (stored === null) return EMPTY_PRIVATE_PAGE_THROTTLE
    if (
      Number.isSafeInteger(stored.failures) && stored.failures >= 0 &&
      Number.isSafeInteger(stored.lockedUntil) && stored.lockedUntil >= 0
    ) {
      return stored
    }
  } catch {
    // Keep the in-memory state if storage is blocked or invalid.
  }
  return fallback
}

function writeThrottle(throttle) {
  try {
    if (throttle.failures === 0) {
      localStorage.removeItem(THROTTLE_KEY)
    } else {
      localStorage.setItem(THROTTLE_KEY, JSON.stringify(throttle))
    }
  } catch {
    // This tab can still enforce the delay with its in-memory state.
  }
}

function PrivatePage({ encryptedPost }) {
  const [payload, setPayload] = useState(null)
  const [checkingSavedKey, setCheckingSavedKey] = useState(true)
  const [password, setPassword] = useState('')
  const [unlocking, setUnlocking] = useState(false)
  const [rejected, setRejected] = useState(false)
  const [error, setError] = useState('')
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const throttle = useRef(EMPTY_PRIVATE_PAGE_THROTTLE)
  const inFlight = useRef(false)

  useEffect(() => {
    let cancelled = false
    const syncThrottle = () => {
      throttle.current = readThrottle(throttle.current)
      setRemainingSeconds(privatePageSecondsRemaining(throttle.current, Date.now()))
    }
    const onStorage = event => {
      if (event.key === THROTTLE_KEY || event.key === null) syncThrottle()
    }

    syncThrottle()
    window.addEventListener('storage', onStorage)
    decryptPostWithSavedKey(encryptedPost, POST_ID).then(saved => {
      if (cancelled) return
      if (saved) {
        throttle.current = EMPTY_PRIVATE_PAGE_THROTTLE
        writeThrottle(throttle.current)
        setRemainingSeconds(0)
        setPayload(saved)
      }
      setCheckingSavedKey(false)
    })
    return () => {
      cancelled = true
      window.removeEventListener('storage', onStorage)
    }
  }, [encryptedPost])

  const countingDown = remainingSeconds > 0
  useEffect(() => {
    if (!countingDown) return
    const timer = window.setInterval(() => {
      setRemainingSeconds(privatePageSecondsRemaining(throttle.current, Date.now()))
    }, 250)
    return () => window.clearInterval(timer)
  }, [countingDown])

  const unlock = async event => {
    event.preventDefault()
    if (!password || inFlight.current || checkingSavedKey) return
    const seconds = privatePageSecondsRemaining(throttle.current, Date.now())
    setRemainingSeconds(seconds)
    if (seconds > 0) return

    inFlight.current = true
    setUnlocking(true)
    setRejected(false)
    setError('')
    try {
      const decrypted = await decryptPost(password, encryptedPost, POST_ID)
      if (decrypted) {
        throttle.current = EMPTY_PRIVATE_PAGE_THROTTLE
        setPassword('')
        setPayload(decrypted)
      } else {
        throttle.current = recordPrivatePageFailure(throttle.current, Date.now())
        setRejected(true)
      }
      writeThrottle(throttle.current)
      setRemainingSeconds(privatePageSecondsRemaining(throttle.current, Date.now()))
    } catch {
      setError('暂时无法解锁，请刷新后再试。')
    } finally {
      inFlight.current = false
      setUnlocking(false)
    }
  }

  const title = payload?.title ?? LOCKED_TITLE
  return (
    <div className='reading-shell'>
      <Head>
        <title>{title}</title>
        <meta name='robots' content='noindex,nofollow,noarchive' />
      </Head>
      {payload && <a className='skip-link' href='#article-wrapper'>跳到正文</a>}
      <aside className='sidebar' aria-label='阅读导航'>
        <PageLink className='all-articles' href='/'>全部文章</PageLink>
      </aside>
      <div className='reading-main'>
        <header className='article-head'>
          <div className='private-page-title'>
            <h1>{title}</h1>
            {payload && (
              <button
                type='button'
                className='post-relock'
                title='清除此设备记住的私密页面密钥'
                onClick={() => {
                  forgetPostKey(POST_ID)
                  setPayload(null)
                }}>
                锁上
              </button>
            )}
          </div>
        </header>
        {payload ? (
          <article
            id='article-wrapper'
            className='prose private-page-body'
            data-pagefind-ignore='all'
            dangerouslySetInnerHTML={{ __html: payload.html }}
          />
        ) : (
          <PasswordForm
            password={password}
            disabled={checkingSavedKey}
            unlocking={unlocking}
            rejected={rejected}
            remainingSeconds={remainingSeconds}
            error={error}
            onPasswordChange={value => {
              setPassword(value)
              setRejected(false)
              setError('')
            }}
            onSubmit={unlock}
          />
        )}
      </div>
    </div>
  )
}

export default function PrivatePageRoute({ id, encryptedPost }) {
  return <PrivatePage key={id} encryptedPost={encryptedPost} />
}

export async function getStaticPaths() {
  let files
  try {
    files = await readdir(join(process.cwd(), 'data/private'), { withFileTypes: true })
  } catch (error) {
    if (error.code === 'ENOENT') return { paths: [], fallback: false }
    throw error
  }
  const paths = files.flatMap(file => {
    const match = file.isFile() && PRIVATE_JSON.exec(file.name)
    return match ? [{ params: { id: match[1] } }] : []
  })
  return { paths, fallback: false }
}

export async function getStaticProps({ params: { id }, locale }) {
  const filename = `${id}.json`
  if (!PRIVATE_JSON.test(filename)) return { notFound: true }

  let ciphertext
  try {
    ciphertext = await readFile(join(process.cwd(), 'data/private', filename), 'utf8')
  } catch (error) {
    if (error.code === 'ENOENT') return { notFound: true }
    throw error
  }
  const { v, iter, salt, iv, data } = JSON.parse(ciphertext)
  if (
    v !== 1 || !Number.isSafeInteger(iter) || iter < 1 ||
    ![salt, iv, data].every(value => typeof value === 'string' && value.length > 0)
  ) {
    throw new Error(`Invalid encrypted payload in data/private/${filename}`)
  }
  const { NOTION_CONFIG, siteInfo } = await fetchGlobalAllData({
    from: 'private-page',
    locale
  })
  return {
    props: {
      id,
      privatePage: true,
      NOTION_CONFIG,
      siteInfo,
      // Keep the same prop name as encrypted posts for the font subset exporter.
      encryptedPost: { v, iter, salt, iv, data }
    }
  }
}
