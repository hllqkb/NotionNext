import { siteConfig } from '@/lib/config'
import CONFIG from '../config'

/**
 * 邮件订阅：普通表单 POST 到 follow.it，新标签页打开它的确认页
 * 不用 fetch：follow.it 的表单接口不给跨域读响应，no-cors 只能盲发，成没成功、要不要验证码都看不到
 */
export const SubscribeForm = ({ id = 'subscribe-email', note = '有新文章时发到你的邮箱。' }) => {
  const action = siteConfig('READING_FOLLOWIT_ACTION', null, CONFIG)
  if (!action) return null
  return (
    <form className='subscribe-form' action={action} method='post' target='_blank'>
      <label htmlFor={id}>{note}</label>
      <div>
        <input id={id} type='email' name='email' required placeholder='你的邮箱' autoComplete='email' inputMode='email' />
        <button type='submit'>订阅</button>
      </div>
    </form>
  )
}

/** 文末：邮件订阅表单，旁边是 RSS */
export const PostSubscribe = () => {
  if (!siteConfig('READING_FOLLOWIT_ACTION', null, CONFIG)) return null
  return (
    <section className='post-subscribe reveal' aria-labelledby='post-subscribe-title'>
      <h2 id='post-subscribe-title'>订阅</h2>
      <SubscribeForm id='post-subscribe-email' />
      {siteConfig('ENABLE_RSS') && (
        <p className='subscribe-alt'>
          也可以用 <a href='/rss/feed.xml' type='application/rss+xml'>RSS</a> 订阅。
        </p>
      )}
    </section>
  )
}

/** /subscribe 页：RSS 和邮件两种方式 */
export const SubscribePage = () => {
  const feed = `${siteConfig('LINK')}/rss/feed.xml`
  return (
    <>
      <header className='list-head'>
        <h1>
          订阅<span className='title-period'>。</span>
        </h1>
        <p className='intro-text'>两种方式，选顺手的一种。</p>
      </header>
      <div className='subscribe-page'>
        <section aria-labelledby='sub-mail'>
          <h2 id='sub-mail'>邮件</h2>
          <SubscribeForm id='subscribe-page-email' />
          <p className='subscribe-hint'>提交后会打开 follow.it 的页面，再去邮箱点一下确认链接就好。随时可以在邮件底部退订。</p>
        </section>
        {siteConfig('ENABLE_RSS') && (
          <section aria-labelledby='sub-rss'>
            <h2 id='sub-rss'>RSS</h2>
            <p>把这个地址加到你的阅读器里：</p>
            <p>
              <a className='subscribe-feed' href='/rss/feed.xml' type='application/rss+xml'>
                {feed}
              </a>
            </p>
          </section>
        )}
      </div>
    </>
  )
}
