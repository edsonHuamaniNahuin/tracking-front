import React, { useState, useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '@/hooks/useAuth'
import { LoginForm } from '@/components/auth/LoginForm'
import { StarIcon } from 'lucide-react'

export default function PageSignIn() {
  const { user, login, loading, error } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user, navigate])

  const [email, setEmail] = useState('admin@tracking.com')
  const [password, setPassword] = useState('admin123')

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await login({ email, password })
  }

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
            loading={loading}
            error={error ?? undefined}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
          />
        </form>
      </div>
      <div className="hidden lg:flex flex-1 bg-muted items-center justify-center">
        <StarIcon className="w-10 h-10" />
      </div>
    </div>
  )
}