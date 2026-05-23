import React, { useState, useEffect, useRef, useCallback, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '@/hooks/useAuth'
import { LoginForm } from '@/components/auth/LoginForm'
import { StarIcon } from 'lucide-react'

const MAX_ATTEMPTS = 5
const BLOCK_DURATION_MS = 30_000
const LONG_BLOCK_MS = 300_000
const LONG_BLOCK_THRESHOLD = 10

function getStored(): { count: number; blockedUntil: number } {
  try {
    const raw = sessionStorage.getItem('login_attempts')
    return raw ? JSON.parse(raw) : { count: 0, blockedUntil: 0 }
  } catch { return { count: 0, blockedUntil: 0 } }
}
function setStored(data: { count: number; blockedUntil: number }) {
  try { sessionStorage.setItem('login_attempts', JSON.stringify(data)) } catch { /* */ }
}
function clearStored() {
  try { sessionStorage.removeItem('login_attempts') } catch { /* */ }
}

export default function PageSignIn() {
  const { user, login, loading, error } = useAuth()
  const navigate = useNavigate()
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [localState, setLocalState] = useState(getStored)
  const pendingAttempt = useRef(false)

  // Limpiar al loguearse exitosamente
  useEffect(() => {
    if (user) {
      clearStored()
      setLocalState({ count: 0, blockedUntil: 0 })
      navigate('/', { replace: true })
    }
  }, [user, navigate])

  // Contar intentos fallidos cuando aparece error después de un submit
  useEffect(() => {
    if (!error || !pendingAttempt.current) return
    pendingAttempt.current = false

    const stored = getStored()
    const newCount = stored.count + 1
    if (newCount >= LONG_BLOCK_THRESHOLD) {
      const u = Date.now() + LONG_BLOCK_MS
      const data = { count: newCount, blockedUntil: u }
      setStored(data)
      setLocalState(data)
    } else if (newCount >= MAX_ATTEMPTS) {
      const u = Date.now() + BLOCK_DURATION_MS
      const data = { count: newCount, blockedUntil: u }
      setStored(data)
      setLocalState(data)
    } else {
      const data = { count: newCount, blockedUntil: 0 }
      setStored(data)
      setLocalState(data)
    }
  }, [error])

  // Countdown timer para desbloquear
  useEffect(() => {
    if (localState.blockedUntil <= Date.now()) {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
      return
    }
    timerRef.current = setInterval(() => {
      const s = getStored()
      if (Date.now() >= s.blockedUntil) {
        setLocalState(s)
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
      }
    }, 500)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [localState.blockedUntil])

  const isBlocked = localState.blockedUntil > Date.now()
  const remainingSeconds = isBlocked
    ? Math.ceil((localState.blockedUntil - Date.now()) / 1000)
    : 0
  const remainingAttempts = isBlocked ? 0 : Math.max(0, MAX_ATTEMPTS - localState.count)

  const handleSubmit = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (isBlocked || loading) return
    pendingAttempt.current = true
    await login({ email, password })
  }, [isBlocked, loading, email, password, login])

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center p-6 bg-white">
        <form
          onSubmitCapture={(e) => e.preventDefault()}
          onSubmit={handleSubmit}
          noValidate
          className="w-full max-w-xs bg-white p-6 rounded-lg shadow"
        >
          <LoginForm
            email={email}
            password={password}
            loading={loading || isBlocked}
            error={error ?? undefined}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
          />

          {isBlocked && (
            <p className="text-amber-600 text-xs text-center mt-3">
              Demasiados intentos fallidos. Espera {remainingSeconds}s.
            </p>
          )}

          {!isBlocked && remainingAttempts <= 3 && remainingAttempts > 0 && (
            <p className="text-muted-foreground text-xs text-center mt-2">
              Te quedan {remainingAttempts} intento{remainingAttempts !== 1 ? 's' : ''}.
            </p>
          )}
        </form>
      </div>
      <div className="hidden lg:flex flex-1 bg-muted items-center justify-center">
        <StarIcon className="w-10 h-10" />
      </div>
    </div>
  )
}
