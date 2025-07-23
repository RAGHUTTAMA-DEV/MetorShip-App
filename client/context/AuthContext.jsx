import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { ApiUrl } from '../configs';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initializeAuth = async () => {
            const storedToken = localStorage.getItem('token');
            if (storedToken) {
                try {
                    // Get user ID from token payload
                    const payload = JSON.parse(atob(storedToken.split('.')[1]));
                    const userId = payload._id;

                    if (!userId) {
                        throw new Error('Invalid token payload');
                    }

                    const response = await axios.get(
                        `${ApiUrl}/auth/profile/${userId}`,
                        {
                            headers: {
                                Authorization: `Bearer ${storedToken}`
                            }
                        }
                    );

                    if (response.data && response.data.user) {
                        console.log('Setting user data:', response.data.user);
                        setUser(response.data.user);
                        setToken(storedToken);
                    } else {
                        throw new Error('Invalid user data received');
                    }
                } catch (error) {
                    console.error('Auth initialization error:', error);
                    localStorage.removeItem('token');
                    setToken(null);
                    setUser(null);
                }
            }
            setLoading(false);
        };

        initializeAuth();
    }, []);

    const login = async (email, password) => {
        try {
            const response = await axios.post(`${ApiUrl}/auth/login`, {
                email,
                password
            });
            const { token, user } = response.data;
            localStorage.setItem('token', token);
            setToken(token);
            setUser(user);
            return { success: true, user };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Login failed'
            };
        }
    };

    const signup = async (userData) => {
        try {
            const response = await axios.post(`${ApiUrl}/auth/signup`, userData);
            const { token, user } = response.data;
            localStorage.setItem('token', token);
            setToken(token);
            setUser(user);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Signup failed'
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    const value = {
        user,
        token,
        loading,
        login,
        signup,
        logout,
        isAuthenticated: !!token
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}; 