import { useContext, useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import './../../styles/Navbar.css'
import { IconHome, IconSearch, IconBell, IconBookmark, IconPlus } from '@tabler/icons-react'
import { AuthContext } from '../../context/Authcontext'
import { getInitials } from '../../utils/PostCard'
import { getUnreadCount } from '../../services/notificationsServices'
import NotificationsPanel from '../Notifications/NotificationsPanel'
export default function Navbar() {
  let { token, setToken, email, myImage, myName } = useContext(AuthContext)
  const navigate = useNavigate()
  const location = useLocation()
  const [showDropdown, setShowDropdown] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const dropdownRef = useRef(null)
  const panelRef = useRef(null)
  const bellRef = useRef(null)
  
  const activeItem = location.pathname.startsWith('/notifications')
    ? 'notifications'
    : location.pathname === '/search'
    ? 'search'
    : location.pathname === '/saved_posts'
    ? 'saved'
    : 'home'
  const bellActive = panelOpen || activeItem === 'notifications'
  
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

  // Close dropdown and notification panel when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      const target = event.target
      if (
        dropdownRef.current?.contains(target) ||
        bellRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return
      }
      setShowDropdown(false)
      setPanelOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    async function loadUnread() {
      if (!token) {
        setUnreadCount(0)
        return
      }
      try {
        const res = await getUnreadCount(token)
        setUnreadCount(res.data?.unreadCount ?? 0)
      } catch {
        setUnreadCount(0)
      }
    }
    loadUnread()
  }, [token])

  function toggleNotificationsPanel() {
    setPanelOpen((isOpen) => !isOpen)
    setShowDropdown(false)
  }

  function LogOut() {
    localStorage.clear()
    setToken(null)
    setShowDropdown(false)
  }

  return <>
    <div className={`${directionClass} rail fixed bottom-0 left-0 right-0 z-10 flex items-center justify-between gap-2 border-t border-white/10 bg-primary px-2! py-2! lg:sticky lg:top-0 lg:left-0 lg:h-dvh lg:w-fit lg:flex-col lg:items-start lg:justify-start lg:gap-10 lg:border-t-0 lg:border-r lg:border-white/10 lg:p-5!`}>
      <div className="contents lg:block lg:px-3 relative">

        <div className="mark hidden! h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ff6b5b] text-lg font-bold text-[#2a0f0a] lg:flex!">L</div>
        <nav className="flex! flex-1 flex-row! items-center justify-around gap-1 lg:flex-col! lg:items-center lg:justify-start lg:gap-2">
            <div onClick={() => navigate('/')} className={`nitem${activeItem === 'home' ? ' active' : ''} flex h-12 w-12 items-center justify-center rounded-[14px]`}><IconHome size={20} /></div>
          <div onClick={() => navigate('/search')} className={`nitem${activeItem === 'search' ? ' active' : ''} lg:flex! hidden! h-12 w-12 items-center justify-center rounded-[14px] cursor-pointer`}><IconSearch size={20} /></div>
          <div ref={bellRef} onClick={toggleNotificationsPanel} className={`nitem${bellActive ? ' active' : ''} flex h-12 w-12 items-center justify-center rounded-[14px] cursor-pointer`}><IconBell size={20} />{unreadCount > 0 && <span className="badge" />}</div>
          <div onClick={() => navigate('/saved_posts')} className={`nitem${activeItem === 'saved' ? ' active' : ''} lg:flex! h-12 w-12 items-center justify-center rounded-[14px]`}><IconBookmark size={20} /></div>

        </nav>
        {panelOpen && (
          <NotificationsPanel
            token={token}
            unreadCount={unreadCount}
            onUnreadCountChange={setUnreadCount}
            panelRef={panelRef}
          />
        )}
      </div>

      <div className="flex shrink-0 items-center gap-3 lg:mt-6 lg:flex-col">
        <div className="compose"><IconPlus size={20} /></div>
        <div className="relative" ref={dropdownRef}>
          <div className="me lg:flex! cursor-pointer" onClick={() => setShowDropdown(!showDropdown)}>
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={avatarName}
                className="h-10 w-10 rounded-xl object-cover!"
              />
            ) : (
              <div className="h-10 w-10 rounded-xl bg-[#ff6b5b] text-sm font-semibold text-[#2a0f0a] flex items-center justify-center">
                {initials}
              </div>
            )}
          </div>
          
          {showDropdown && (
            <div className="rail__dropdown absolute bottom-16 left-0 w-70 bg-primary rounded-2xl shadow-lg p-5 z-50">
              <div className="rail__dropdown-user text-left! mb-4 pb-4 border-b border-gray-200">
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
