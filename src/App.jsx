import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
import 'react-toastify/dist/ReactToastify.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import MainLayout from './Pages/Layouts/MainLayout/MainLayout'
import AuthLayout from './Pages/Layouts/AuthLayout/AuthLayout'
import AllPosts from './Pages/AllPosts/AllPosts'
import UserPosts from './Pages/UserPosts/UserPosts'
import NotFound from './Pages/NotFound/NotFound'
import Login from './Pages/Authentication/Login/Login'
import Registeration from './Pages/Authentication/Registeration/Registeration'
import ForgotPassword from './Pages/Authentication/ForgotPassword/ForgotPassword'
import ChangePassword from './Pages/Authentication/ChangePassword/ChangePassword'
 import { ToastContainer, toast } from 'react-toastify';
import AppProtectedRoutes from './components/ProtectedRoutes/AppProtectedRoutes'
import Settings from './Pages/Settings/Settings'
import AuthProtectedRoutes from './components/ProtectedRoutes/AuthProtectedRoutes'
import Search from './components/Search/Search'
import SinglePost from './Pages/SinglePost/SinglePost'
import FollowingPosts from './Pages/FollowingPosts/FollowingPosts'
import UserProfile from './Pages/UserProfile/UserProfile'
import MyProfile from './Pages/MyProfile/myProfile'
import SavedPosts from './Pages/SavedPosts/SavedPosts'
function App() {
  const routs = createBrowserRouter([
    {
      path: "/", element: <MainLayout />, children: [
        { index: true, element:<AppProtectedRoutes> <AllPosts /></AppProtectedRoutes> },
        { path: "search", element: <AppProtectedRoutes><Search /></AppProtectedRoutes> },
        { path: "posts/:id", element: <AppProtectedRoutes><SinglePost /></AppProtectedRoutes> },
        { path: "user_posts", element: <AppProtectedRoutes><UserPosts /></AppProtectedRoutes> },
        { path: "following", element: <AppProtectedRoutes><FollowingPosts /></AppProtectedRoutes> },
        { path: "user_profile/:id", element: <AppProtectedRoutes><UserProfile/></AppProtectedRoutes> },
        { path: "my_profile", element: <AppProtectedRoutes><MyProfile/></AppProtectedRoutes> },
        { path: "saved_posts", element: <AppProtectedRoutes><SavedPosts/></AppProtectedRoutes> },
        { path: "settings", element: <AppProtectedRoutes><Settings /></AppProtectedRoutes> },
        { path: "*", element: <NotFound /> }
      ]
    },
    {
      path: '/', element: <AuthLayout />, children: [
        { path: "login", element: <AuthProtectedRoutes> <Login /></AuthProtectedRoutes> },
        { path: "registration", element: <AuthProtectedRoutes><Registeration /></AuthProtectedRoutes> },
        { path: "forgot-password", element: <AuthProtectedRoutes><ForgotPassword /></AuthProtectedRoutes> },
        { path: "change-password", element: <AuthProtectedRoutes><ChangePassword /> </AuthProtectedRoutes>}
      ]
    }
  ])

  return (
    <>
      <ToastContainer theme="dark" position="top-right" autoClose={3000} />
      <RouterProvider router={routs}></RouterProvider>
    </>
  )

}

export default App
