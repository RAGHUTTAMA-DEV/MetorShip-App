import { useState } from "react";
import axios from "axios"
import { Navigate } from "react-router-dom";

export default function Signup(){
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [role, setRole] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [username,setusername]=useState(" ");

    async function Signupcall(){
        try{
            const data=await axios.post("http://localhost:3000/api/auth/signup",{
                email,
                password,
                role,
                username
            })

            if(data.status===200){
                alert("Signup successfull")
                Navigate("/login");
            }
            else{
                alert("Signup failed")
            }

        }catch(err){
            setError(err.message)
            console.log(err.message)
        }
    }
    return(
        <div>
            <h1>SignUp</h1>
            
            <input placeholder="Enter the email" onChange={(e)=>setEmail(e.target.value)}/>
            <input placeholder="Enter the password" onChange={(e)=>setPassword(e.target.value)}/>
            <input placeholder="Enter the Role" onChange={(e)=>setRole(e.target.value)}/>
            <input placeholder="Enter the username" onChange={(e)=>setusername(e.target.value)}/>/

            <button onClick={Signupcall}>SignUP</button>
        </div>
    )
}