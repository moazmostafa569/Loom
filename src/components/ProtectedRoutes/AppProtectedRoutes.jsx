import React, { Children, useEffect } from 'react'
import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../context/Authcontext'

export default function AppProtectedRoutes({children}) {

    const navigate = useNavigate()
     
    // const userToken = localStorage.getItem('user-token')
    let {token} = useContext(AuthContext)
    useEffect(()=>{
        if(!token){
            navigate('/login')
        }
    },[token])
  return children
}
