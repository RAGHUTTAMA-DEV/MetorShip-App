import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const { token } = useAuth();

    useEffect(() => {
        if (!token) return;

        const newSocket = io('http://localhost:3000', {
            auth: { token },
            transports: ['websocket']
        });

        newSocket.on('connect', () => {
            console.log('Socket connected');
        });

        newSocket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });

        newSocket.on('error', (error) => {
            console.error('Socket error:', error);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [token]);

    const value = {
        socket,
        isConnected: socket?.connected || false
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};

export default SocketContext; 