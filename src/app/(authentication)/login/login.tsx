'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { 
  Alert, Button, Col, Form, FormControl, InputGroup, Row 
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
    <>
      {error && (
        <Alert variant="danger" className="mb-3" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Form onSubmit={handleSubmit}>
        {/* Input Email */}
        <InputGroup className="mb-3">
          <InputGroupText>
            <FontAwesomeIcon icon={faEnvelope} fixedWidth />
          </InputGroupText>
          <FormControl
            type="email"
            name="email"
            required
            disabled={submitting}
            placeholder="Masukkan Email"
            aria-label="Email"
          />
        </InputGroup>

        {/* Input Password */}
        <InputGroup className="mb-3">
          <InputGroupText>
            <FontAwesomeIcon icon={faLock} fixedWidth />
          </InputGroupText>
          <FormControl
            type="password"
            name="password"
            required
            disabled={submitting}
            placeholder={dict.login?.form?.password || 'Masukkan Password'}
            aria-label="Password"
          />
        </InputGroup>

        {/* Tombol Submit */}
        <Row className="align-items-center">
          <Col xs={6}>
            <Button className="px-4" variant="primary" type="submit" disabled={submitting}>
              {submitting ? 'Loading...' : dict.login?.form?.submit || 'Login'}
            </Button>
          </Col>
        </Row>
      </Form>
    </>
  )
}
