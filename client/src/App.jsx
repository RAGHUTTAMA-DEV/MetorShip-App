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
function App() {
 
  return(
    <BrowserRouter>
    <Routes>
      <Route path='/' element={<Home/>}/>
      <Route path='/mentor' element={<Mentor/>}/>
      <Route path='/booking' element={<Booking/>}/>
      <Route path='/profile' element={<Profile/>}/>
      <Route path='/login' element={<Login/>}/>
      <Route path='/signup' element={<Signup/>}/>
    </Routes>
    </BrowserRouter>
   
  )
}

export default App
