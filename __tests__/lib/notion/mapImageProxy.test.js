/**
 * @jest-environment node
 */

import BLOG from '@/blog.config'
import { mapImgUrl } from '@/lib/db/notion/mapImage'
import { buildImgProxyPath, stableSourceKey } from '@/lib/db/notion/imgProxy'

const BLOCK_ID = '3ab487c8-7fd8-80df-b976-e74078232d32'
const ATTACHMENT = 'attachment:89da7f2e-0215-4515-8cc8-204d6646257f:图片.png'
const S3 =
  'https://prod-files-secure.s3.us-west-2.amazonaws.com/427487c8-7fd8-81dc-a5ee-00034e84d0b0/89da7f2e-0215-4515-8cc8-204d6646257f/a.png?X-Amz-Signature=abc&X-Amz-Expires=3600'

const original = {
  IMG_PROXY: BLOG.IMG_PROXY,
  RANDOM_IMAGE_URL: BLOG.RANDOM_IMAGE_URL
}

describe('mapImgUrl 同站图片代理', () => {
  beforeEach(() => {
    BLOG.IMG_PROXY = true
    BLOG.RANDOM_IMAGE_URL = ''
  })

  afterEach(() => {
    Object.assign(BLOG, original)
  })

  it('Notion 上传图片输出 /img/ 相对地址，不再出现 notion.so/image', () => {
    const ret = mapImgUrl(ATTACHMENT, { type: 'image', id: BLOCK_ID })
    expect(ret).toBe(
      `/img/block/${BLOCK_ID}?src=${encodeURIComponent(ATTACHMENT)}`
    )
  })

  it('S3 签名地址同样走代理，collection 封面保留 table', () => {
    const ret = mapImgUrl(S3, { id: BLOCK_ID }, 'collection')
    expect(ret.startsWith(`/img/collection/${BLOCK_ID}?src=`)).toBe(true)
    expect(ret).not.toContain('notion.so')
  })

  it('file.notion.com 新 CDN 地址先还原为 attachment 再走代理', () => {
    const ret = mapImgUrl(
      'https://file.notion.com/f/f/427487c8-7fd8-81dc-a5ee-00034e84d0b0/89da7f2e-0215-4515-8cc8-204d6646257f/cover.png?signature=x',
      { id: BLOCK_ID }
    )
    expect(ret).toBe(
      `/img/block/${BLOCK_ID}?src=${encodeURIComponent('attachment:89da7f2e-0215-4515-8cc8-204d6646257f:cover.png')}`
    )
  })

  it('已映射过的代理地址原样返回', () => {
    const once = mapImgUrl(ATTACHMENT, { id: BLOCK_ID })
    expect(mapImgUrl(once, { id: BLOCK_ID })).toBe(once)
  })

  it('外链图仍走 Notion /image/ 中转（代理只认 Notion 自己的文件）', () => {
    const ret = mapImgUrl('https://am.zdmimg.com/a.png', {
      type: 'image',
      id: BLOCK_ID
    })
    expect(ret).toContain(`${BLOG.NOTION_HOST}/image/`)
  })

  it('本站 public/images 图片保持直连', () => {
    const own = `${BLOG.LINK.replace(/\/$/, '')}/images/wechat/a.webp`
    expect(mapImgUrl(own, { id: BLOCK_ID })).toBe(own)
  })

  it('关闭开关时沿用 Notion /image/ 中转', () => {
    BLOG.IMG_PROXY = false
    expect(mapImgUrl(ATTACHMENT, { id: BLOCK_ID })).toContain(
      `${BLOG.NOTION_HOST}/image/`
    )
  })
})

describe('imgProxy 地址校验', () => {
  it('缓存键去掉签名参数', () => {
    expect(stableSourceKey(S3)).toBe(S3.split('?')[0])
  })

  it.each([
    'https://evil.example.com/a.png',
    'http://prod-files-secure.s3.us-west-2.amazonaws.com/a.png',
    'https://s3.us-west-2.amazonaws.com/other-bucket/a.png',
    'attachment:not-a-uuid:a.png',
    'javascript:alert(1)'
  ])('拒绝 %s', src => {
    expect(stableSourceKey(src)).toBeNull()
  })

  it('id 不是 UUID 或 table 不认识时不生成代理地址', () => {
    expect(buildImgProxyPath(ATTACHMENT, 'block', 'block-id-1')).toBeNull()
    expect(buildImgProxyPath(ATTACHMENT, 'space', BLOCK_ID)).toBeNull()
  })
})
