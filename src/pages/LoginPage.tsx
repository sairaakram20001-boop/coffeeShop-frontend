import { useState } from 'react'
import type { FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Alert from '../components/Alert'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'

export default function LoginPage() {
  const { login, register } = useAuth()
  const { notify } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/checkout'
  const gateMessage = (location.state as { message?: string } | null)?.message

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()

    if (mode === 'register') {
      await register({ name, email, password })
      notify('Account created. Please login.', 'success')
      setMode('login')
      return
    }

    await login({ email, password })
    notify('Welcome back!', 'success')
    navigate(redirectTo)
  }

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      {gateMessage && <Alert message={gateMessage} type="info" />}
      <form onSubmit={onSubmit} className="mt-4 rounded-3xl border border-[var(--stone)]/50 bg-white p-7 shadow-sm">
        <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--rosewood)]/80">Account Access</p>
        <h1 className="mt-2 font-serif text-5xl font-semibold text-[var(--ink)]">{mode === 'login' ? 'Login' : 'Register'}</h1>
        {mode === 'register' && (
          <input className="input mt-4" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        )}
        <input className="input mt-4" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="input mt-3" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <Button className="mt-5 w-full" type="submit">{mode === 'login' ? 'Login' : 'Create Account'}</Button>
        <button
          type="button"
          className="mt-3 w-full text-sm font-semibold text-amber-900"
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
        >
          {mode === 'login' ? 'Need an account? Register' : 'Have an account? Login'}
        </button>
      </form>
    </main>
  )
}

