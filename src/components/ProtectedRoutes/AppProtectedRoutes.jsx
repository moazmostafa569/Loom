import React, { useContext, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { AuthContext } from '../../context/Authcontext'

export default function AppProtectedRoutes({children}) {
    const { token } = useContext(AuthContext)
    const [authChecked, setAuthChecked] = useState(false)
    const [storedToken, setStoredToken] = useState(null)

    useEffect(() => {
        const confirmedToken = localStorage.getItem('user-token') || null
        setStoredToken(confirmedToken)
        setAuthChecked(true)
    }, [token])

    if (!authChecked) {
        return (
            <div className="auth-route-loading" role="status" aria-label="Checking authentication">
                <div className="auth-route-spinner" />
            </div>
        )
    }

    const activeToken = localStorage.getItem('user-token') || storedToken

    if (!activeToken) {
        return <Navigate to="/login" replace />
    }

    return children
}
