'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSubabaseClient } from '@/lib/browserClient'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firmName, setFirmName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createBrowserSubabaseClient()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Sign up user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: firmName },
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        return
      }

      if (data.user) {
        // Create firm
        const { data: firm, error: firmError } = await supabase
          .from('firms')
          .insert([{ name: firmName, state: 'FL', email_contact: email }])
          .select()

        if (firmError) throw firmError

        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              firm_id: firm.id,
              full_name: firmName,
              role: 'firm_owner',
            },
          ])

        if (profileError) throw profileError

        router.push('/dashboard')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fcfcf9' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '8px', width: '100%', maxWidth: '400px', border: '1px solid rgba(94, 82, 64, 0.2)' }}>
        <h1 style={{ marginBottom: '30px', fontSize: '28px', textAlign: 'center' }}>Create Account</h1>

        <form onSubmit={handleSignUp}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Firm Name</label>
            <input
              type="text"
              value={firmName}
              onChange={(e) => setFirmName(e.target.value)}
              required
              placeholder="Your Law Firm"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid rgba(94, 82, 64, 0.2)',
                borderRadius: '6px',
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@lawfirm.com"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid rgba(94, 82, 64, 0.2)',
                borderRadius: '6px',
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Min 8 characters"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid rgba(94, 82, 64, 0.2)',
                borderRadius: '6px',
              }}
            />
          </div>

          {error && (
            <div style={{
              background: '#fee',
              color: '#c0152f',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '20px',
              fontSize: '14px',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: loading ? '#ccc' : '#208096',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px' }}>
          Already have an account? <a href="/auth/login" style={{ color: '#208096', fontWeight: 600 }}>Sign In</a>
        </p>
      </div>
    </div>
  )
}