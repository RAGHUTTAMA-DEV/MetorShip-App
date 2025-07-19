import Peer from "simple-peer";
import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

export default function Webrtc({ roomId, room, user, socket: propSocket }) {
    const [stream, setStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const myVideo = useRef();
    const userVideo = useRef();
    const streamRef = useRef();
    const [socket, setSocket] = useState(null);
    const peerRef = useRef();
    const [callAccepted, setCallAccepted] = useState(false);

    // Get the other participant's userId
    const getOtherUserId = () => {
        if (!room || !user) return null;
        if (room.mentor && room.mentor._id !== user.id && room.mentor._id !== user._id) return room.mentor._id;
        if (room.learner && room.learner._id !== user.id && room.learner._id !== user._id) return room.learner._id;
        return null;
    };

    useEffect(() => {
        let activeSocket = propSocket;
        if (!activeSocket) {
            activeSocket = io('https://metorship-app.onrender.com');
            setSocket(activeSocket);
        } else {
            setSocket(activeSocket);
        }
        return () => {
            if (!propSocket && activeSocket) {
                activeSocket.disconnect();
            }
        };
    }, [propSocket]);

    useEffect(() => {
        if (!socket) return;
        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
            setStream(stream);
            streamRef.current = stream;
            if (myVideo.current) {
                myVideo.current.srcObject = stream;
            }
            if (socket && roomId) {
                socket.emit("join-room", roomId);
            }

            // Only one user should be initiator (e.g. mentor or by userId sort)
            const isInitiator = user && room && room.mentor && (user.id === room.mentor._id || user._id === room.mentor._id);
            const otherUserId = getOtherUserId();
            if (!peerRef.current) {
                peerRef.current = new Peer({
                    initiator: isInitiator,
                    trickle: false,
                    stream,
                    config: {
                        iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }]
                    }
                });
            }
            const peer = peerRef.current;

            peer.on('signal', (signalData) => {
                if (isInitiator && otherUserId) {
                    socket.emit('call-user', {
                        userToCall: otherUserId,
                        signalData,
                        from: user.id || user._id
                    });
                } else if (!isInitiator && callAccepted && otherUserId) {
                    socket.emit('answer-call', {
                        signal: signalData,
                        to: otherUserId
                    });
                }
            });

            peer.on('stream', (remoteStream) => {
                setRemoteStream(remoteStream);
                if (userVideo.current) {
                    userVideo.current.srcObject = remoteStream;
                }
            });

            socket.on('call-made', ({ signal, from }) => {
                peer.signal(signal);
                setCallAccepted(true);
            });

            socket.on('call-accepted', ({ signal }) => {
                peer.signal(signal);
            });
        }).catch((err) => {
            console.error("Error accessing media devices.", err);
        });
        // Cleanup listeners on unmount
        return () => {
            if (socket) {
                socket.off('call-made');
                socket.off('call-accepted');
            }
            if (peerRef.current) {
                peerRef.current.destroy();
                peerRef.current = null;
            }
        };
    }, [roomId, socket, room, user]);

    return (
        <div className="flex gap-4">
            <div>
                <div className="font-semibold mb-1">Your Video</div>
                <video ref={myVideo} autoPlay muted className="rounded border w-64 h-48 bg-black" />
            </div>
            <div>
                <div className="font-semibold mb-1">Remote Video</div>
                <video ref={userVideo} autoPlay className="rounded border w-64 h-48 bg-black" />
            </div>
        </div>
    );
}