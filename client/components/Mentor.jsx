import { useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import { ApiUrl } from '../configs';

export default function Mentor(){
    return(
        <div>
            <h1>Mentor</h1>
        </div>
    )
}