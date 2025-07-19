import Peer from "simple-peer";
import React, { useEffect, useRef, useState } from "react";


export default function Webrtc({ roomId }){
            const socket=io('https://metorship-app.onrender.com', {
            auth: { token }
        });
    const [stream, setStream] = useState(null);
    const [peers, setPeers] = useState({});
    const myVideo = useRef();
    const userVideo = useRef();
    const peersRef = useRef([]);
    const streamRef = useRef();
    useEffect(() => {
        navigator.media.getUserMedia({ video: true, audio: true }).then((stream) => {
            setStream(stream);
                 streamRef.current = stream;

            userVideo.current.srcObject = stream;
            socket.emit("join-room", roomId, stream);

        }).catch((err) => {
            console.error("Error accessing media devices.", err);
        }); 
       
    }, [roomId]);

}