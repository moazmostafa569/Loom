import { useContext, useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './../../styles/Navbar.css'
import { IconHome, IconSearch, IconBell, IconBookmark, IconMail, IconPlus } from '@tabler/icons-react'
import { AuthContext } from '../../context/Authcontext'
import { getInitials } from '../../utils/PostCard'
export default function Navbar() {
  let { token, setToken, email, myImage, myName } = useContext(AuthContext)
  const navigate = useNavigate()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)
  
  const isArabicDevice =
    typeof navigator !== 'undefined' &&
    [navigator.language, ...(navigator.languages || [])].some((language) =>
      language?.toLowerCase().startsWith('ar')
    )
  const directionClass = isArabicDevice ? '[direction:rtl] lg:[direction:ltr]' : ''

  // Get user email from context
  const userEmail = email || 'user@example.com'
  const avatarSrc = myImage?.trim() || ''
  const avatarName = myName?.trim() || userEmail
  const initials = getInitials(avatarName)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function LogOut() {
    localStorage.clear()
    setToken(null)
    setShowDropdown(false)
  }

  return <>
    <div className={`${directionClass} rail fixed bottom-0 left-0 right-0 z-10 flex items-center justify-between gap-2 border-t border-white/10 bg-primary !px-2 !py-2 lg:sticky lg:top-0 lg:left-0 lg:h-[100dvh] lg:w-fit lg:flex-col lg:items-start lg:justify-start lg:gap-10 lg:border-t-0 lg:border-r lg:border-white/10 lg:!p-5`}>
      <div className="contents lg:block lg:px-3">

        <div className="mark !hidden h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#ff6b5b] text-lg font-bold text-[#2a0f0a] lg:!flex">L</div>
        <nav className="!flex flex-1 !flex-row items-center justify-around gap-1 lg:!flex-col lg:items-center lg:justify-start lg:gap-2">
          <div onClick={()=> navigate('/')} className="nitem active flex h-12 w-12 items-center justify-center rounded-[14px]"><IconHome size={20} /></div>
          <div onClick={() => navigate('/search')} className="nitem lg:!flex !hidden h-12 w-12 items-center justify-center rounded-[14px] cursor-pointer"><IconSearch size={20} /></div>
          <div className="nitem flex h-12 w-12 items-center justify-center rounded-[14px]"><IconBell size={20} /><span className="badge" /></div>
          <div onClick={()=> navigate('/saved_posts')} className="nitem lg:!flex h-12 w-12 items-center justify-center rounded-[14px]"><IconBookmark size={20} /></div>

          <div className="nitem flex h-12 w-12 items-center justify-center rounded-[14px]"><IconMail size={20} /></div>
        </nav>
      </div>

      <div className="flex shrink-0 items-center gap-3 lg:mt-6 lg:flex-col">
        <div className="compose"><IconPlus size={20} /></div>
        <div className="relative" ref={dropdownRef}>
          <div className="me lg:!flex cursor-pointer" onClick={() => setShowDropdown(!showDropdown)}>
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={avatarName}
                className="h-10 w-10 rounded-xl !object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-xl bg-[#ff6b5b] text-sm font-semibold text-[#2a0f0a] flex items-center justify-center">
                {initials}
              </div>
            )}
          </div>
          
          {showDropdown && (
            <div className="rail__dropdown absolute bottom-16 left-0 w-70 bg-primary rounded-2xl shadow-lg p-5 z-50">
              <div className="rail__dropdown-user !text-left mb-4 pb-4 border-b border-gray-200">
                <p className="rail__dropdown-label text-sm text-gray-600">Signed in as</p>
                <p className="rail__dropdown-email text-[#9B97A8] font-medium truncate">{userEmail}</p>
              </div>
              <button onClick={() => navigate('/my_profile')} className="rail__dropdown-btn w-full text-left px-4 py-3 text-gray-700 cursor-pointer hover:bg-gray-300 rounded-lg mb-2 transition">
                My Profile
              </button>
              <button 
                onClick={LogOut}
                className="rail__dropdown-btn w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-300 cursor-pointer rounded-lg transition"
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  </>
}
