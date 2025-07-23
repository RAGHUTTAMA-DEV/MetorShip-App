import Peer from "simple-peer";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";

export default function Webrtc({ roomId, room, user, socket: propSocket }) {
    const [stream, setStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [callAccepted, setCallAccepted] = useState(false);
    const [socket, setSocket] = useState(null);
    const [connectionState, setConnectionState] = useState('disconnected');
    
    const myVideo = useRef();
    const userVideo = useRef();
    const streamRef = useRef();
    const peerRef = useRef();
    const socketRef = useRef();
    const isInitialized = useRef(false);

    const getOtherUserId = useCallback(() => {
        if (!room || !user) return null;
        const currentUserId = user.id || user._id;
        if (room.mentor && room.mentor._id !== currentUserId) return room.mentor._id;
        if (room.learner && room.learner._id !== currentUserId) return room.learner._id;
        return null;
    }, [room, user]);
    const isInitiator = useCallback(() => {
        if (!user || !room) return false;
        const currentUserId = (user.id || user._id).toString();
        const mentorId = room.mentor && room.mentor._id ? room.mentor._id.toString() : '';
        const result = mentorId === currentUserId;
        console.log('isInitiator:', result, 'currentUserId:', currentUserId, 'mentorId:', mentorId);
        return result;
    }, [user, room]);

    useEffect(() => {
        let activeSocket = propSocket;
        if (!activeSocket) {
            activeSocket = io('http://localhost:3000', {
                transports: ['websocket', 'polling']
            });
        }
        setSocket(activeSocket);
        socketRef.current = activeSocket;

        return () => {
            if (!propSocket && activeSocket) {
                activeSocket.disconnect();
            }
        };
    }, [propSocket]);

    // Cleanup functio
    const cleanup = useCallback(() => {
        if (peerRef.current) {
            peerRef.current.destroy();
            peerRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (socketRef.current) {
            socketRef.current.off('call-made');
            socketRef.current.off('call-accepted');
            socketRef.current.off('room:userLeft');
        }
        setCallAccepted(false);
        setConnectionState('disconnected');
        isInitialized.current = false;
    }, []);

    // Create peer connection
    const createPeer = useCallback((stream, initiator = false) => {
        const peer = new Peer({
            initiator,
            trickle: false,
            stream,
            config: {
                iceServers: [
                    { urls: "stun:stun.l.google.com:19302" },
                    { urls: "stun:stun1.l.google.com:19302" }
                ]
            }
        });

        peer.on('signal', (signalData) => {
            const otherUserId = getOtherUserId();
            const currentUserId = user.id || user._id;
            
            if (!otherUserId || !socketRef.current) return;

            if (initiator) {
                socketRef.current.emit('call-user', {
                    userToCall: otherUserId,
                    signalData,
                    from: currentUserId
                });
            } else {
                socketRef.current.emit('answer-call', {
                    signal: signalData,
                    to: otherUserId
                });
            }
        });

        peer.on('stream', (remoteStream) => {
            console.log('Received remote stream');
            setRemoteStream(remoteStream);
            if (userVideo.current) {
                userVideo.current.srcObject = remoteStream;
            }
        });

        peer.on('connect', () => {
            console.log('Peer connection established');
            setConnectionState('connected');
        });

        peer.on('error', (err) => {
            console.error('Peer connection error:', err);
            setConnectionState('error');
        });

        peer.on('close', () => {
            console.log('Peer connection closed');
            setConnectionState('disconnected');
        });

        return peer;
    }, [getOtherUserId, user]);

    useEffect(() => {
        if (!socket || !roomId || !user || isInitialized.current) return;

        isInitialized.current = true;
        console.log('Initializing WebRTC for room:', roomId);

        navigator.mediaDevices.getUserMedia({ 
            video: { width: 640, height: 480 }, 
            audio: true 
        }).then((mediaStream) => {
            console.log('Got user media');
            setStream(mediaStream);
            streamRef.current = mediaStream;
            
            if (myVideo.current) {
                myVideo.current.srcObject = mediaStream;
            }

            socket.emit("room:join", roomId);

            const shouldInitiate = isInitiator();
            console.log('Should initiate:', shouldInitiate, 'User:', user.id || user._id);
            
            peerRef.current = createPeer(mediaStream, shouldInitiate);

            const handleCallMade = ({ signal, from, name }) => {
                console.log('Received call from:', from, name);
                
                if (peerRef.current && !shouldInitiate) {
                    try {
                        peerRef.current.signal(signal);
                        setCallAccepted(true);
                        setConnectionState('connecting');
                    } catch (err) {
                        console.error('Error signaling peer on call-made:', err);
                    }
                }
            };

            const handleCallAccepted = ({ signal, to }) => {
                console.log('Call accepted by:', to);
                
                if (peerRef.current && shouldInitiate) {
                    try {
                        peerRef.current.signal(signal);
                        setCallAccepted(true);
                        setConnectionState('connecting');
                    } catch (err) {
                        console.error('Error signaling peer on call-accepted:', err);
                    }
                }
            };

            const handleUserLeft = ({ userId, username }) => {
                console.log('User left:', username, userId);
                const otherUserId = getOtherUserId();
                if (userId === otherUserId) {
                    setRemoteStream(null);
                    setCallAccepted(false);
                    setConnectionState('disconnected');
                    if (userVideo.current) {
                        userVideo.current.srcObject = null;
                    }
                    // Reset peer connection
                    if (peerRef.current) {
                        peerRef.current.destroy();
                        peerRef.current = null;
                    }
                }
            };

            socket.on('call-made', handleCallMade);
            socket.on('call-accepted', handleCallAccepted);
            socket.on('room:userLeft', handleUserLeft);

        }).catch((err) => {
            console.error("Error accessing media devices:", err);
            setConnectionState('error');
        });

        return cleanup;
    }, [socket, roomId, user, isInitiator, createPeer, cleanup, getOtherUserId]);
    useEffect(() => {
        if (userVideo.current && remoteStream) {
            userVideo.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    useEffect(() => {
        return cleanup;
    }, [cleanup]);

    return (
        <div className="flex flex-col gap-4">
            <div className="text-sm text-gray-600">
                Connection Status: <span className={`font-semibold ${
                    connectionState === 'connected' ? 'text-green-600' : 
                    connectionState === 'connecting' ? 'text-yellow-600' : 
                    connectionState === 'error' ? 'text-red-600' : 'text-gray-600'
                }`}>
                    {connectionState}
                </span>
                {user && room && (
                    <span className="ml-2 text-xs">
                        (Role: {room.mentor && (user.id === room.mentor._id || user._id === room.mentor._id) ? 'Mentor/Initiator' : 'Learner'})
                    </span>
                )}
            </div>
            
            <div className="flex gap-4 flex-wrap">
                <div>
                    <div className="font-semibold mb-1">Your Video</div>
                    <video 
                        ref={myVideo} 
                        autoPlay 
                        muted 
                        playsInline
                        className="rounded border w-64 h-48 bg-black" 
                    />
                </div>
                <div>
                    <div className="font-semibold mb-1">
                        Remote Video {!callAccepted && "(Waiting for connection...)"}
                    </div>
                    <video 
                        ref={userVideo} 
                        autoPlay 
                        playsInline
                        className="rounded border w-64 h-48 bg-black" 
                    />
                </div>
            </div>
        </div>
    );
}