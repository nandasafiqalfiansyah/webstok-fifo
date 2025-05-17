'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { 
  Alert, Button, Form, FormControl, InputGroup 
} from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEnvelope } from '@fortawesome/free-regular-svg-icons'
import { faLock } from '@fortawesome/free-solid-svg-icons'
import useDictionary from '@/locales/dictionary-hook'
import InputGroupText from 'react-bootstrap/InputGroupText'

export default function Login({ callbackUrl }: { callbackUrl: string }) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const dict = useDictionary()

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    const formData = new FormData(event.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })
      if (!res?.ok) {
        throw new Error('Email atau password salah')
      }
      router.push(callbackUrl || '/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="w-100">
      {error && (
        <Alert variant="danger" className="mb-3" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Form onSubmit={handleSubmit}>
        {/* Input Email */}
        <InputGroup className="mb-3">
          <InputGroupText className="px-3">
            <FontAwesomeIcon icon={faEnvelope} fixedWidth />
          </InputGroupText>
          <FormControl
            type="email"
            name="email"
            required
            disabled={submitting}
            placeholder="Masukkan Email"
            aria-label="Email"
            className="py-2 text-dark"
          />
        </InputGroup>

        {/* Input Password */}
        <InputGroup className="mb-4">
          <InputGroupText className="px-3">
            <FontAwesomeIcon icon={faLock} fixedWidth />
          </InputGroupText>
          <FormControl
            type="password"
            name="password"
            required
            disabled={submitting}
            placeholder={dict.login?.form?.password || 'Masukkan Password'}
            aria-label="Password"
            className="py-2 text-dark"
          />
        </InputGroup>

        {/* Tombol Submit */}
        <div className="d-grid">
          <Button 
            variant="primary" 
            type="submit" 
            disabled={submitting}
            size="lg"
            className="py-2 fw-semibold"
          >
            {submitting ? 'Loading...' : dict.login?.form?.submit || 'Login'}
          </Button>
        </div>
      </Form>
    </div>
  )
}