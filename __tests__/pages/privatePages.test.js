import { readdir } from 'node:fs/promises'
import {
  EMPTY_PRIVATE_PAGE_THROTTLE,
  privatePageSecondsRemaining,
  recordPrivatePageFailure
} from '@/lib/privatePageThrottle'
import { getStaticPaths } from '@/pages/p/[id]'

jest.mock('node:fs/promises', () => ({ readdir: jest.fn() }))
jest.mock('@/lib/db/SiteDataApi', () => ({ fetchGlobalAllData: jest.fn() }))
jest.mock('@/themes/reading/components/Frame', () => ({ PageLink: () => null }))

it.each([
  ['the directory is empty', []],
  ['only .gitkeep is present', [{ name: '.gitkeep', isFile: () => true }]]
])('exports no private paths when %s', async (_, files) => {
  readdir.mockResolvedValue(files)

  await expect(getStaticPaths()).resolves.toEqual({ paths: [], fallback: false })
})

it('exports a private route for a matching JSON file', async () => {
  const id = '4c806cc86ccaf0cd'
  readdir.mockResolvedValue([
    { name: `${id}.json`, isFile: () => true },
    { name: 'draft.json', isFile: () => true },
    { name: 'dd9734b45b28d64d.json', isFile: () => false }
  ])

  await expect(getStaticPaths()).resolves.toEqual({
    paths: [{ params: { id } }],
    fallback: false
  })
})

it('locks after five failures and doubles subsequent delays up to an hour', () => {
  const expectedDelays = [0, 0, 0, 0, 30, 60, 120, 240, 480, 960, 1920, 3600, 3600]
  let throttle = EMPTY_PRIVATE_PAGE_THROTTLE
  let now = 10_000
  for (const seconds of expectedDelays) {
    throttle = recordPrivatePageFailure(throttle, now)
    expect(privatePageSecondsRemaining(throttle, now)).toBe(seconds)
    now += seconds * 1000
    expect(privatePageSecondsRemaining(throttle, now)).toBe(0)
  }
})

it('keeps the countdown visible until the lockout expires', () => {
  const throttle = { failures: 5, lockedUntil: 31_000 }
  expect(privatePageSecondsRemaining(throttle, 30_999)).toBe(1)
  expect(privatePageSecondsRemaining(throttle, 31_000)).toBe(0)
})
