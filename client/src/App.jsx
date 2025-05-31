import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { BrowserRouter,Routes,Route } from 'react-router-dom'
import Home from '../components/Home'
import Mentor from '../components/Mentor'
import Booking from '../components/Booking'
import Profile from '../components/Profile'
import Login from '../components/Login'
import Signup from '../components/SignUp'
import ProtectedRoute from '../components/ProtectedRoute'
import LearnerDashboard from '../components/LeanerDashBorad'
import MentorDashboard from '../components/MentorDashBorad'
import AdminDashboard from '../components/AdminDashBorad'
import Room from '../components/Room'
function App() {
 
  return(
    <BrowserRouter>
    <Routes>
      <Route path='/' element={<Home/>}/>
      <Route path='/booking' element={<Booking/>}/>
      <Route path='/profile' element={<Profile/>}/>
      <Route path='/login' element={<Login/>}/>
      <Route path='/signup' element={<Signup/>}/>
      <Route path="/mentor" element={
                        <ProtectedRoute roles={['mentor']}>
                            <MentorDashboard />
                        </ProtectedRoute>
                    } />
      <Route path="/user" element={
                        <ProtectedRoute roles={['user']}>
                          <LearnerDashboard/>
      </ProtectedRoute>}/>
      <Route path="/room/:roomId" element={
    <ProtectedRoute>
        <Room />
    </ProtectedRoute>
} />
      <Route path='admin' element={
         <ProtectedRoute roles={['admin']}>
            <AdminDashboard/>
         </ProtectedRoute>
      }/>

    </Routes>
    </BrowserRouter>
   
  )
}

export default App
