import { Link } from "react-router-dom"
export default function Home(){
    return(
        <div>
            <h1>Book a Home</h1>
            <div>
                <Link to="/home">Home</Link>
                <Link to="/menrors">Mentors</Link>
                <Link to="/booking">Booking</Link>
                <Link to="/login">Login</Link>
                <Link to="/Signup">Register</Link>
            </div>
        </div>
    )
}