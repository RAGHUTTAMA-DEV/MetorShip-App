import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import MentorDashboard from './components/MentorDashboard';
import LearnerDashboard from './components/LearnerDashboard';
import Room from './components/Room';
import PrivateRoute from './components/PrivateRoute';

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
              <Route path="/register" element={<Register />} />
              <Route 
                path="/mentor-dashboard" 
                element={
                  <PrivateRoute>
                    <MentorDashboard />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/learner-dashboard" 
                element={
                  <PrivateRoute>
                    <LearnerDashboard />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/room/:roomId" 
                element={
                  <PrivateRoute>
                    <Room />
                  </PrivateRoute>
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
