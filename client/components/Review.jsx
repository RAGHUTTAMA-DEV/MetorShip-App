import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import  { useAuth } from "../context/AuthContext";
import axios from "axios";
import { ApiUrl } from "../configs";
import toast from "react-hot-toast";

export default function Review({ bookingId, mentor }) {
    const { token } = useAuth(AuthContext);
    const navigate = useNavigate();
    const [reviewText, setReviewText] = useState("");
    const [rating, setRating] = useState(0);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [reviews, setReviews] = useState([]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError("");
            setSuccess("");
            
            const response = await axios.post(`${API_URL}/reviews`, {
                bookingId,
                review: reviewText,
                rating,
                mentor
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!response.data.success) {
                throw new Error(response.data.message);
            }
            
            setSuccess(response.data.message);
            setReviewText("");
            setRating(0);
            setIsSubmitted(true);
            setLoading(false);
            toast.success(response.data.message);

        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || "An error occurred";
            setError(errorMessage);
            setLoading(false);
            toast.error(errorMessage);
        }
    };

    return (
        <div className="review-container">
            <h1>Submit Review</h1>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="review">Review:</label>
                    <textarea 
                        id="review"
                        placeholder="Write your review here..." 
                        value={reviewText} 
                        onChange={(e) => setReviewText(e.target.value)}
                        required
                        rows="4"
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="rating">Rating (1-5):</label>
                    <input 
                        id="rating"
                        type="number" 
                        min="1"
                        max="5"
                        placeholder="Rating" 
                        value={rating} 
                        onChange={(e) => setRating(parseInt(e.target.value))}
                        required
                    />
                </div>
                
                <button type="submit" disabled={loading}>
                    {loading ? "Submitting..." : "Submit Review"}
                </button>
            </form>
            
            {error && <p className="error">{error}</p>}
            {success && <p className="success">{success}</p>}
            {isSubmitted && <p className="success">Review submitted successfully!</p>}
        </div>
    );
}