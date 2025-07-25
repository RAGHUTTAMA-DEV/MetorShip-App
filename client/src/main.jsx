import { Buffer } from 'buffer';
import process from 'process';
window.Buffer = Buffer;
window.process = process;
window.global = window;
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { AuthProvider } from '../context/AuthContext';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <AuthProvider>
            <App />
        </AuthProvider>
    </React.StrictMode>
); 