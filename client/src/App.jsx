import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from '../components/Home';
import Login from '../components/Login';
import Signup from '../components/SignUp';
import MentorDashboard from '../components/MentorDashBorad';
import LearnerDashboard from '../components/LeanerDashBorad';
import Room from '../components/Room';
import ProtectedRoute from '../components/ProtectedRoute';
import { AuthProvider } from '../context/AuthContext';

function App() {
  return (
      <AuthProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Signup />} />
              <Route path="/unauthorized" element={<div>Unauthorized Access</div>} />
              <Route 
                path="/mentor-dashboard" 
                element={
                  <ProtectedRoute roles={'mentor'}>
                    <MentorDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/learner-dashboard" 
                element={
                  <ProtectedRoute roles={'user'}>
                    <LearnerDashboard />
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

              <Route path='/room/:roomId/' element={
                <ProtectedRoute>
                  <Room />
                </ProtectedRoute>
              } />

              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
      </AuthProvider>
  );
}

export default App;
