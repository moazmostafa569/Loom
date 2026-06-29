import { useState } from 'react'
import './../../../index.css'
import { IconSparkles, IconEye, IconEyeOff, IconArrowRight } from '@tabler/icons-react'
import { useForm } from 'react-hook-form'
import { registrationSchema } from '../../../utils/authschema';
import { zodResolver } from '../../../utils/zodResolver';
import { registerUser } from '../../../services/authServices';
import { toast } from 'react-toastify';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@heroui/react';
export default function Registeration() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showRePassword, setShowRePassword] = useState(false)
  const [apiError, setApiError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [currentStep, setCurrentStep] = useState(() => {
    const s = parseInt(localStorage.getItem('registrationStep'), 10)
    return isNaN(s) ? 1 : Math.min(3, Math.max(1, s))
  })

  let { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    mode: 'onChange',
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      name: '',
      username: '',
      email: '',
      dateOfBirth: '',
      gender: '',
      password: '',
      rePassword: '',
      terms: true,
    },
  })






  async function submit(data) {
    setApiError('')
    setSuccessMessage('')
    console.log('submit payload', data);
    try {
      let response = await registerUser(data)
      const message = response.data?.message || response.message || 'Signup success'
    
      toast.success(message)
      setSuccessMessage(message)
      navigate('/login')
      console.log(message)
      const next = Math.min(3, currentStep + 1)
      setCurrentStep(next)
      try { localStorage.setItem('registrationStep', String(next)) } catch { /* ignore storage errors */ }
    } catch (error) {
      const responseData = error.response?.data
      let errorMessage = responseData?.message || responseData?.errors || responseData || error.message
      toast.error(errorMessage)
      if (typeof errorMessage !== 'string') {
        errorMessage = JSON.stringify(errorMessage)
      }
      setApiError(errorMessage)
      console.error('signup error', responseData || error)
    }
  }

  return <>
    <div className='min-h-screen bg-[#0b0a11]'>
      <div className='grid grid-cols-1 lg:grid-cols-2'>
        <div className='hero-panel bg-primary px-6 py-8 lg:px-12 lg:py-12'>
          <div className="hero">
            <div className="logo text-white"><span className="dot" /> loom</div>
            <svg className="hero-art" viewBox="0 0 520 700" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
              <path d="M60 620 C 150 540, 120 420, 220 380 C 320 340, 300 220, 410 170" fill="none" stroke="#8fe3c0" strokeOpacity="0.35" strokeWidth="1.5" strokeDasharray="2 8" />
              <path d="M40 120 C 140 160, 180 260, 290 270 C 400 280, 420 400, 470 480" fill="none" stroke="#ff6b5b" strokeOpacity="0.3" strokeWidth="1.5" strokeDasharray="2 8" />
              <path d="M150 60 C 200 140, 160 230, 250 300" fill="none" stroke="#f4c95d" strokeOpacity="0.28" strokeWidth="1.5" strokeDasharray="2 8" />
              <circle cx={60} cy={620} r={26} fill="#262232" stroke="#8fe3c0" strokeWidth="1.5" />
              <circle cx={220} cy={380} r={34} fill="#262232" stroke="#8fe3c0" strokeWidth="1.5" />
              <circle cx={410} cy={170} r={22} fill="#332d44" stroke="#5e5a6e" strokeWidth="1.5" />
              <circle cx={40} cy={120} r={18} fill="#332d44" stroke="#5e5a6e" strokeWidth="1.5" />
              <circle cx={290} cy={270} r={40} fill="#ff6b5b" />
              <circle cx={470} cy={480} r={28} fill="#262232" stroke="#ff6b5b" strokeWidth="1.5" />
              <circle cx={150} cy={60} r={16} fill="#332d44" stroke="#5e5a6e" strokeWidth="1.5" />
              <circle cx={250} cy={300} r={20} fill="#262232" stroke="#f4c95d" strokeWidth="1.5" />
              <text x={290} y={276} fontFamily="Fraunces, serif" fontSize={22} fill="#2a0f0a" textAnchor="middle" fontWeight={600}>L</text>
            </svg>
            <div className="hero-copy">
              <div className="eyebrow">Join the network</div>
              <h1>Every story<br />has a <em>thread.</em></h1>
              <p>Loom connects what you post to the people who care about it — no noise, just the threads worth following.</p>
            </div>
            <div className="steps">
              <div className="seg"><div className={`node ${currentStep >= 1 ? 'active' : ''}`} /></div>
              <div className="line" />
              <div className="seg"><div className={`node ${currentStep >= 2 ? 'active' : ''}`} /></div>
              <div className="line" />
              <div className="seg"><div className={`node ${currentStep >= 3 ? 'active' : ''}`} /></div>
              <div className="label">step {currentStep} of 3 — create account</div>
            </div>
          </div>
        </div>
        <form className="form-side px-3 py-8 sm:px-6 lg:px-10 lg:py-12" onSubmit={handleSubmit(submit)}>
          <div className="card">
            <div className="tag"><IconSparkles size={16} stroke={1.5} /> free to join</div>
            <h2 className='text-white'>Start your thread</h2>
            <p className="sub">Create an account to post, follow people, and build your own corner of Loom.</p>
            <div className="field">
              <label htmlFor="lname">Full Name</label>
              <input className="w-full bg-[#262232] p-3 rounded-2xl text-white" aria-invalid={!!errors.name} {...register('name')} id="fullname" type="text" placeholder="Mostafa" />
              <p className="text-red-500 text-sm mt-1">{errors.name?.message}</p>
            </div>
            <div className="field">
              <label htmlFor="uname">Username</label>
              <input className="w-full bg-[#262232] p-3 rounded-2xl text-white" aria-invalid={!!errors.username} {...register('username')} id="uname" type="text" placeholder="moaz_zaki_1" />
              <p className="text-red-500 text-sm mt-1">{errors.username?.message}</p>
            </div>
            <div className="field">
              <label htmlFor="email">Email address</label>
              <input className="w-full bg-[#262232] p-3 rounded-2xl text-white" aria-invalid={!!errors.email} {...register('email')} id="email" type="email" placeholder="moaz@example.com" />
              <p className="text-red-500 text-sm mt-1">{errors.email?.message}</p>
            </div>
            <div className="field">
              <label htmlFor="pwd">Password</label>
              <div className="input-wrap">
                <input className="w-full bg-[#262232] p-3 rounded-2xl text-white" aria-invalid={!!errors.password} {...register('password')} id="pwd" type={showPassword ? 'text' : 'password'} placeholder="8+ chars, uppercase, number & special" />
                {showPassword ? (
                  <IconEyeOff size={18} className="toggle-vis cursor-pointer" onClick={() => setShowPassword(false)} />
                ) : (
                  <IconEye size={18} className="toggle-vis cursor-pointer" onClick={() => setShowPassword(true)} />
                )}
              </div>
              <p className="text-red-500 text-sm mt-1">{errors.password?.message}</p>
            </div>
            <div className="field">
              <label htmlFor="rePassword">RePassword</label>
              <div className="input-wrap">
                <input className="w-full bg-[#262232] p-3 rounded-2xl text-white" aria-invalid={!!errors.rePassword} {...register('rePassword')} id="rePassword" type={showRePassword ? 'text' : 'password'} placeholder="At least 8 characters" />
                {showRePassword ? (
                  <IconEyeOff size={18} className="toggle-vis cursor-pointer" onClick={() => setShowRePassword(false)} />
                ) : (
                  <IconEye size={18} className="toggle-vis cursor-pointer" onClick={() => setShowRePassword(true)} />
                )}
              </div>
              <p className="text-red-500 text-sm mt-1">{errors.rePassword?.message}</p>
            </div>
            <div className="field">
              <label htmlFor="dateOfBirth">Date of Birth</label>
              <input className="w-full bg-[#262232] p-3 rounded-2xl text-white" aria-invalid={!!errors.dateOfBirth} {...register('dateOfBirth')} id="dateOfBirth" type="date" />
              <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth?.message}</p>

            </div>
            <div id="gender" className="field">
              <label className='text-w' htmlFor="gender">Gender</label>
              <select aria-invalid={!!errors.gender} {...register('gender')} id="gender" className="field bg-[#262232] p-3 rounded-2xl text-white">
                <option value="" disabled defaultValue>Select a gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
              <p className="text-red-500 text-sm mt-1">{errors.gender?.message}</p>
            </div>
            <div className="terms">
              <input type="checkbox" id="terms" {...register('terms')} />
              <p>I agree to Loom's <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>, and confirm I'm at least 16 years old.</p>
            </div>
            <p className="text-red-500 text-sm mt-1">{errors.terms?.message}</p>
            <Button isLoading={isSubmitting} className="btn-primary w-full flex justify-center items-center" type="submit">
              Create account <IconArrowRight size={16} stroke={1.5} />
            </Button>
            {successMessage && (
              <div role="alert" className="alert alert-success mt-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{successMessage}</span>
              </div>
            )}
            {apiError && (
              <div role="alert" className="alert alert-error mt-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{apiError}</span>
              </div>
            )}
            <div className="foot">Already have an account? <Link to="/login">Sign in</Link></div>
          </div>
        </form>
      </div>
    </div>
  </>
}
