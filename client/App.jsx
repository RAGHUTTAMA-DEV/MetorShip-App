import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Login from './components/Login';
import SignUp from './components/SignUp';
import MentorDashBorad from './components/MentorDashBorad';
import LeanerDashBorad from './components/LeanerDashBorad';
import Room from './components/Room';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <ChakraProvider>
      <AuthProvider>
        <SocketProvider>
          <Router>
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route 
                path="/mentor-dashboard" 
                element={
                  <ProtectedRoute>
                    <MentorDashBorad />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/learner-dashboard" 
                element={
                  <ProtectedRoute>
                    <LeanerDashBorad />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/room/:roomId" 
                element={
                  <ProtectedRoute>
                    <Room />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </Router>
        </SocketProvider>
      </AuthProvider>
    </ChakraProvider>
  );
}

export default App; 