import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

export default function Home() {
    const { user } = useAuth();

    // Redirect based on user role
    if (user?.role === 'user') {
        return <Navigate to="/user" replace />;
    } else if (user?.role === 'mentor') {
        return <Navigate to="/mentor" replace />;
    } else if (user?.role === 'admin') {
        return <Navigate to="/admin" replace />;
    }

    return (
        <div className="home-container">
            <h1>Welcome to Mentorship App</h1>
            <p>Please wait while we redirect you to your dashboard...</p>
        </div>
    );
}