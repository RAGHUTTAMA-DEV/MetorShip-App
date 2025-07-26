import { useEffect } from "react"
import axios from "axios"
import { useAuth } from "../context/AuthContext";

export default function AllMentorsDetails(){
     const [mentos, setMentors] = useState([]);
     const token =useAuth();

    useEffect(()=>{
     fetchmentordetails();
    },[])

    const fetchmentordetails = async () => {
        const response=axios.get(
            {
            url:  '${ApiUrl}/api/auth/mentors'
            },{
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            }
        )

        if(!response){
            console.log("error")
        }else{
            setMentors(response.data);
        }
    }

    return(
        <div>
             All mentor details

             
        </div>
    )
}