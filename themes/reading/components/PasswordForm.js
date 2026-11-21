export default function PasswordForm({
  password,
  onPasswordChange,
  onSubmit,
  unlocking,
  rejected,
  disabled = false,
  remainingSeconds = 0,
  error
}) {
  const blocked = disabled || unlocking || remainingSeconds > 0

  return (
    <form className='post-lock' onSubmit={onSubmit}>
      <label htmlFor='post-lock-password'>这篇文章需要密码。</label>
      <div>
        <input
          id='post-lock-password'
          type='password'
          autoComplete='current-password'
          value={password}
          disabled={blocked}
          onChange={e => onPasswordChange(e.target.value)}
        />
        <button type='submit' disabled={blocked || !password}>
          {unlocking ? '解锁中' : '解锁'}
        </button>
      </div>
      {rejected && <p role='alert'>密码不对，再试一次。</p>}
      {error && <p role='alert'>{error}</p>}
      {remainingSeconds > 0 && (
        <p role='timer'>请在 {remainingSeconds} 秒后重试。</p>
      )}
    </form>
  )
}
