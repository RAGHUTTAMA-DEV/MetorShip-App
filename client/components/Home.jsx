import { useAuth } from '../context/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { ApiUrl } from '../configs';

export default function Home() {
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            if (user.role === 'user') {
                navigate('/learner-dashboard', { replace: true });
            } else if (user.role === 'mentor') {
                navigate('/mentor-dashboard', { replace: true });
            } else if (user.role === 'admin') {
                navigate('/admin', { replace: true });
            }
        }
    }, [user, navigate]);

    return (
        <div className="home-container">
            <h1>Welcome to Mentorship App</h1>
            <p>Please wait while we redirect you to your dashboard...</p>
        </div>
    );
}