import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Login from '../(authentication)/login/login'
import '@testing-library/jest-dom'
import { vi, expect } from 'vitest'

// Mocking next/router dan next-auth
const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

const signInMock = vi.fn()

vi.mock('next-auth/react', () => ({
  signIn: (...args: any[]) => signInMock(...args),
}))

vi.mock('@/locales/dictionary-hook', () => {
  return () => ({
    login: {
      form: {
        password: 'Masukkan Password',
        submit: 'Login',
      },
    },
  })
})

describe('Login component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders email and password inputs and submit button', () => {
    render(<Login callbackUrl="/dashboard" />)

    expect(screen.getByPlaceholderText('Masukkan Email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Masukkan Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument()
  })

  it('calls signIn with correct credentials and redirects on success', async () => {
    signInMock.mockResolvedValue({ ok: true })

    render(<Login callbackUrl="/dashboard" />)

    fireEvent.change(screen.getByPlaceholderText('Masukkan Email'), {
      target: { value: 'admin@gmail.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('Masukkan Password'), {
      target: { value: 'admin' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Login/i }))

    await waitFor(() => {
      expect(signInMock).toHaveBeenCalledWith('credentials', {
        email: 'admin@gmail.com',
        password: 'admin',
        redirect: false,
      })

      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('shows error message when login fails', async () => {
    signInMock.mockResolvedValue({ ok: false })

    render(<Login callbackUrl="/dashboard" />)

    fireEvent.change(screen.getByPlaceholderText('Masukkan Email'), {
      target: { value: 'admin@gmail.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('Masukkan Password'), {
      target: { value: 'wrongpass' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Login/i }))

    expect(await screen.findByText(/Email atau password salah/i)).toBeInTheDocument()
  })
})
