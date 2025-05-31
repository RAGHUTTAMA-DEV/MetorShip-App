import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError("");

        const result = await login(email, password);
        
        if (result.success) {
            const from = location.state?.from?.pathname || "/";
            navigate('/');
        } else {
            setError(result.error);
        }
        
        setLoading(false);
    }   

    return (
        <div>
            <h1>Login</h1>
            {error && <div style={{ color: 'red' }}>{error}</div>}
            
            <form onSubmit={handleSubmit}>
                <input 
                    placeholder="Enter the email" 
                    onChange={(e) => setEmail(e.target.value)}
                    type="text"
                    required
                />
                <input 
                    placeholder="Enter the password" 
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    required
                />

                <button type="submit" disabled={loading}>
                    {loading ? "Logging in..." : "Login"}
                </button>
            </form>
        </div>
    );
}