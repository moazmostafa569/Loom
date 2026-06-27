import React, { useEffect, useState, createContext } from 'react'
export const AuthContext = createContext()
export default function AuthcontextProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('user-token') || null)
  const [email, setEmail] = useState(() => localStorage.getItem('user-email') || null)
  const [myImage, setMyImage] = useState(() => localStorage.getItem('user-image') || '')
  const [myName, setMyName] = useState(() => localStorage.getItem('user-name') || '')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user-token', token || '')
    }
  }, [token])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user-email', email || '')
    }
  }, [email])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user-image', myImage || '')
    }
  }, [myImage])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user-name', myName || '')
    }
  }, [myName])

  return (
    <AuthContext.Provider value={{ token, setToken, email, setEmail, myImage, setMyImage, myName, setMyName }}>
      {children}
    </AuthContext.Provider>
  )
}
