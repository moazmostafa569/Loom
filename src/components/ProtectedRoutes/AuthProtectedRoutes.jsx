import React, { Children, useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../context/Authcontext'

export default function AuthProtectedRoutes({children}) {

    const navigate = useNavigate()
     
    // const userToken = localStorage.getItem('user-token')
     let {token} = useContext(AuthContext)
    useEffect(()=>{
        if(token){
            navigate('/')
        }
    },[token])
  return children
}
