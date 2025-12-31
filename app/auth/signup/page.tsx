'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signUpAction } from './signupAction'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firmName, setFirmName] = useState('')
  const [usState, setUsState] = useState('FL')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

const handleSignUp = async (e: React.FormEvent) => {
  e.preventDefault()
  if (loading) return

  setError('')
  setLoading(true)

  try {
    await signUpAction(
      email.trim(),
      password,
      firmName.trim(),
      usState.trim()
    )

    router.push('/dashboard')
  } catch (err) {
    if (err instanceof Error) {
      setError(err.message)
    } else {
      setError('Something went wrong')
    }
  } finally {
    setLoading(false)
  }
}


   return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fcfcf9',
      }}
    >
      <div
        style={{
          background: 'white',
          padding: '40px',
          borderRadius: '8px',
          width: '100%',
          maxWidth: '400px',
          border: '1px solid rgba(94, 82, 64, 0.2)',
        }}
      >
        <h1
          style={{
            marginBottom: '30px',
            fontSize: '28px',
            textAlign: 'center',
          }}
        >
          Create Account
        </h1>

        <form onSubmit={handleSignUp}>
          {/* Firm Name */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px' }}>
              Firm Name
            </label>
            <input
              type="text"
              value={firmName}
              onChange={(e) => setFirmName(e.target.value)}
              required
            />
          </div>

          {/* State */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px' }}>
              State
            </label>
            <input
              type="text"
              value={usState}
              onChange={(e) => setUsState(e.target.value)}
              required
            />
          </div>

          {/* Email */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p style={{ color: 'red' }}>{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? 'Creating…' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  )
}