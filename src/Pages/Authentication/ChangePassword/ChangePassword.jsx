import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '../../../utils/zodResolver'
import { changePasswordSchema } from '../../../utils/authschema'
import { changePassword } from '../../../services/authServices'
import { toast } from 'react-toastify'
import { useNavigate, Link } from 'react-router-dom'

export default function ChangePassword() {
  const navigate = useNavigate()
  const [apiError, setApiError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    mode: 'onChange',
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      password: '',
      rePassword: '',
    },
  })

  async function submit(data) {
    setApiError('')
    setSuccessMessage('')

    try {
      const response = await changePassword({ password: data.password, rePassword: data.rePassword })
      const message = response?.message || 'Password changed successfully.'
      toast.success(message)
      setSuccessMessage(message)
      setTimeout(() => navigate('/'), 1800)
    } catch (error) {
      const responseData = error.response?.data
      let errorMessage = responseData?.message || responseData?.errors || responseData || error.message || 'Failed to change password.'
      if (typeof errorMessage !== 'string') {
        errorMessage = JSON.stringify(errorMessage)
      }
      toast.error(errorMessage)
      setApiError(errorMessage)
      console.error('change password error', responseData || error)
    }
  }

  return (
    <div className="wrap">
      <div className="content">
        <div className="brand">
          <div className="mark">L</div>
          <div className="word">loom</div>
          <div className="eyebrow">Change your password</div>
        </div>
        <div className="card">
          <h1>Change password</h1>
          <p className="sub">Enter a new password and confirm it.</p>
          <form onSubmit={handleSubmit(submit)}>
            <div className="field">
              <label htmlFor="password">New password</label>
              <input
                id="password"
                type="password"
                placeholder="New password"
                {...register('password')}
              />
              {errors.password?.message && <p className="error-message">{errors.password.message}</p>}
            </div>

            <div className="field">
              <label htmlFor="rePassword">Confirm new password</label>
              <input
                id="rePassword"
                type="password"
                placeholder="Confirm new password"
                {...register('rePassword')}
              />
              {errors.rePassword?.message && <p className="error-message">{errors.rePassword.message}</p>}
            </div>

            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update password'}
            </button>
            {successMessage && <p className="success-message">{successMessage}</p>}
            {apiError && <p className="error-message">{apiError}</p>}
          </form>
          <div className="foot">
            Remembered your old password? <Link to="/">Back to home</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
