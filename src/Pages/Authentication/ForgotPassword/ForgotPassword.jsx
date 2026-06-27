import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '../firebaseConfig'
import { toast } from 'react-toastify'
import { Link, useNavigate } from 'react-router-dom'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [apiError, setApiError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: 'onChange',
    defaultValues: { email: '' },
  })

  async function submit(data) {
    setApiError('')
    setSuccessMessage('')

    try {
      await sendPasswordResetEmail(auth, data.email)
      const message = 'Password reset instructions have been sent to your email.'
      toast.success(message)
      setSuccessMessage(message)
      setTimeout(() => {
        navigate('/login')
      }, 1800)
    } catch (error) {
      const errorMessage = error.message || 'Failed to send password reset email.'
      toast.error(errorMessage)
      setApiError(errorMessage)
      console.error('forgot password error', error)
    }
  }

  return (
    <div className="wrap">
      <div className="content">
        <div className="brand">
          <div className="mark">L</div>
          <div className="word">loom</div>
          <div className="eyebrow">Reset your password</div>
        </div>
        <div className="card">
          <h1>Forgot password</h1>
          <p className="sub">Enter your email and we&apos;ll send reset instructions.</p>
          <form onSubmit={handleSubmit(submit)}>
            <div className="field">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                placeholder="mira@example.com"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Enter a valid email',
                  },
                })}
              />
              {errors.email?.message && <p className="error-message">{errors.email.message}</p>}
            </div>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send reset email'}
            </button>
            {successMessage && <p className="success-message">{successMessage}</p>}
            {apiError && <p className="error-message">{apiError}</p>}
          </form>
          <div className="foot">
            Remembered your password? <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
