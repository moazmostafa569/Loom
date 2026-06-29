import { useContext, useState } from 'react'
import './../../../styles/Login.css'
import './../../../index.css'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema } from '../../../utils/authschema'
import { loginUser } from '../../../services/authServices'
import { setStoredUserId } from '../../../utils/UserDetails'
import { getAvatarPhoto } from '../../../utils/PostCard'
import { toast } from 'react-toastify'
import { useNavigate, Link } from 'react-router-dom'
import { IconEye, IconEyeOff } from '@tabler/icons-react'
import { AuthContext } from './../../../context/Authcontext';

export default function Login() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [apiError, setApiError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  let { setToken, setEmail, setUserId, setMyName, setMyImage } = useContext(AuthContext)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    mode: 'onChange',
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  async function submit(data) {
    setApiError('')
    setSuccessMessage('')

    try {
      const response = await loginUser(data)
      const tokenValue = response.data?.token
      const apiUser = response.data?.user ?? response.user ?? null
      const userIdValue = apiUser?._id || apiUser?.id
      const userName = apiUser?.name || apiUser?.fullname || ''
      const userPhoto = getAvatarPhoto(apiUser?.photo || apiUser?.avatar || apiUser?.image)

      localStorage.setItem('user-token', tokenValue)
      localStorage.setItem('user-email', data.email)
      if (userIdValue) {
        localStorage.setItem('user-id', userIdValue)
        setStoredUserId(userIdValue)
        setUserId(userIdValue)
      }
      localStorage.setItem('user-name', userName)
      setMyName(userName)
      localStorage.setItem('user-image', userPhoto)
      setMyImage(userPhoto)
      const message = response?.message || 'Login success'
      toast.success(message)
      setSuccessMessage(message)
      setToken(tokenValue)
      setEmail(data.email)
      navigate('/')
    } catch (error) {
      const responseData = error.response?.data
      let errorMessage = responseData?.message || responseData?.errors || responseData || error.message || 'Login failed'
      if (typeof errorMessage !== 'string') {
        errorMessage = JSON.stringify(errorMessage)
      }
      toast.error(errorMessage)
      setApiError(errorMessage)
      console.error('login error', responseData || error)
    }
  }

  return (
    <div className='wrap'>
      <svg className="field-bg" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <path d="M-50 760 C 150 700, 260 560, 420 540 C 600 520, 640 380, 820 360 C 1000 340, 1040 200, 1240 160 C 1380 130, 1440 80, 1500 40" fill="none" stroke="#8fe3c0" strokeOpacity="0.16" strokeWidth="1.5" strokeDasharray="2 10"></path>
        <path d="M-80 220 C 100 260, 220 180, 380 240 C 540 300, 620 180, 800 220 C 980 260, 1080 140, 1280 200 C 1400 236, 1460 320, 1520 360" fill="none" stroke="#ff6b5b" strokeOpacity="0.14" strokeWidth="1.5" strokeDasharray="2 10"></path>
        <path d="M100 880 C 260 820, 340 900, 500 820 C 660 740, 760 860, 920 800 C 1080 740, 1180 840, 1340 780" fill="none" stroke="#f4c95d" strokeOpacity="0.12" strokeWidth="1.5" strokeDasharray="2 10"></path>
        <circle cx="-50" cy="760" r="22" fill="none" stroke="#8fe3c0" strokeOpacity="0.3" strokeWidth="1.5"></circle>
        <circle cx="420" cy="540" r="30" fill="none" stroke="#8fe3c0" strokeOpacity="0.3" strokeWidth="1.5"></circle>
        <circle cx="1240" cy="160" r="18" fill="none" stroke="#8fe3c0" strokeOpacity="0.3" strokeWidth="1.5"></circle>
        <circle cx="380" cy="240" r="24" fill="none" stroke="#ff6b5b" strokeOpacity="0.28" strokeWidth="1.5"></circle>
        <circle cx="800" cy="220" r="34" fill="none" stroke="#ff6b5b" strokeOpacity="0.28" strokeWidth="1.5"></circle>
        <circle cx="1280" cy="200" r="20" fill="none" stroke="#ff6b5b" strokeOpacity="0.28" strokeWidth="1.5"></circle>
        <circle cx="500" cy="820" r="18" fill="none" stroke="#f4c95d" strokeOpacity="0.25" strokeWidth="1.5"></circle>
        <circle cx="920" cy="800" r="26" fill="none" stroke="#f4c95d" strokeOpacity="0.25" strokeWidth="1.5"></circle>
      </svg>

      <div className="content">
        <div className="brand">
          <div className="mark">L</div>
          <div className="word">loom</div>
          <div className="eyebrow">Welcome back to your threads</div>
        </div>

        <div className="card">
          <h1>Sign in</h1>
          <p className="sub">Pick up right where your threads left off.</p>

          <form onSubmit={handleSubmit(submit)}>
            <div className="field">
              <label htmlFor="email">Email address</label>
              <input id="email" type="email" placeholder="mira@example.com" {...register('email')} />
              
              {errors.email?.message && <p className="error-message text-sm text-red-500">{errors.email.message}</p>}
            </div>

            <div className="field">
              <label htmlFor="pwd">Password</label>
              <div className="input-wrap">
                <input id="pwd" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" {...register('password')} />
                {showPassword ? (
                  <IconEyeOff size={18} className="toggle-vis cursor-pointer" onClick={() => setShowPassword(false)} />
                ) : (
                  <IconEye size={18} className="toggle-vis cursor-pointer" onClick={() => setShowPassword(true)} />
                )}
              </div>
              {errors.password?.message && <p className="error-message text-sm text-red-500">{errors.password.message}</p>}
            </div>

            <div className="row-between">
              <label className="remember"><input type="checkbox" defaultChecked /> Remember me</label>
              <Link to="/forgot-password">Forgot password?</Link>
            </div>

            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Sign in'} <i className="ti ti-arrow-right" />
            </button>

            {successMessage && <p className="success-message">{successMessage}</p>}
            {apiError && <p className="error-message">{apiError}</p>}
          </form>

          <div className="foot">New to Loom? <Link to="/registration">Create an account</Link></div>
        </div>
      </div>
    </div>
  )
}

