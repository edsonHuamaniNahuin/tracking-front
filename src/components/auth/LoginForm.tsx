import React, { type FC } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Link } from 'react-router-dom'

interface LoginFieldsProps {
  email: string
  password: string
  loading: boolean
  error?: string
  onEmailChange: (v: string) => void
  onPasswordChange: (v: string) => void
  className?: string
}

export const LoginForm: FC<LoginFieldsProps> = ({
  email,
  password,
  loading,
  error,
  onEmailChange,
  onPasswordChange,
  className
}) => (
  <div className={cn('flex flex-col gap-6', className)}>
    {error && <div className="text-red-600 text-center">{error}</div>}
    <div className="text-center">
      <h1 className="text-2xl font-bold">Login to your account</h1>
      <p className="text-sm text-muted-foreground">
        Enter your email and password
      </p>
    </div>
    <div className="grid gap-6">
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => onEmailChange(e.currentTarget.value)}
        />
      </div>
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link
            to="/forgot-password"
            className="text-sm underline-offset-4 hover:underline"
          >
            Forgot your password?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => onPasswordChange(e.currentTarget.value)}
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Ingresando...' : 'Login'}
      </Button>
    </div>

    <div className="text-center text-sm">
      Don&apos;t have an account?{' '}
      <Link to="/signup" className="underline hover:opacity-75">
        Sign up
      </Link>
    </div>
  </div>
)
