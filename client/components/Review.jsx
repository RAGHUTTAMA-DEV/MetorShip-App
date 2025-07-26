import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { ApiUrl } from "../configs";
import toast from "react-hot-toast";

export default function Review({ bookingId, mentor, onReviewSubmitted }) {
    console.log("Review component received props:", { bookingId, mentor });
    const { token } = useAuth();
    const navigate = useNavigate();
    const [reviewText, setReviewText] = useState("");
    const [rating, setRating] = useState(0);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [showReviewForm, setShowReviewForm] = useState(false);
    useEffect(() => {
        if (mentor?.id) {
            fetchReviews();
        }
    }, [mentor]);

    const fetchReviews = async () => {
        try {
            const response = await axios.get(`${ApiUrl}/reviews/mentors/${mentor.id}`,{
                headers: {
                    Authorization: `Bearer ${token}`    
                }
            });
            console.log(response.data.reviews);
            setReviews(response.data.reviews || []);
        } catch (err) {
            console.error('Error fetching reviews:', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Validation for required fields
        if (!bookingId || !reviewText.trim() || !rating || !mentor?.id) {
            setError("All fields are required: bookingId, review, rating, and mentor.");
            return;
        }
        try {
            setLoading(true);
            setError("");
            setSuccess("");
            const payload = {
                bookingId,
                review: reviewText,
                rating,
                mentor: mentor.id
            };
            console.log("Submitting review payload:", payload);
            const response = await axios.post(`${ApiUrl}/reviews`, payload, {
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
            setShowReviewForm(false);
            setLoading(false);
            toast.success(response.data.message);
            
            await fetchReviews();
            
            if (onReviewSubmitted) {
                onReviewSubmitted();
            }

        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || "An error occurred";
            setError(errorMessage);
            setLoading(false);
            toast.error(errorMessage);
        }
    };

    const calculateAverageRating = () => {
        if (reviews.length === 0) return 0;
        const total = reviews.reduce((sum, review) => sum + review.rating, 0);
        return (total / reviews.length).toFixed(1);
    };

    return (
        <div className="review-container bg-white p-6 rounded-lg shadow-md">
            <div className="mb-6">
                <h2 className="text-2xl font-bold mb-4">Mentor Details</h2>
                <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                            {mentor?.username?.charAt(0)?.toUpperCase() || 'M'}
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold">{mentor?.username || 'Unknown Mentor'}</h3>
                            <p className="text-gray-600">{mentor?.email || 'No email available'}</p>
                            <p className="text-gray-600">Expertise: {mentor?.expertise || 'Not specified'}</p>
                            <div className="flex items-center mt-2">
                                <span className="text-yellow-500">★</span>
                                <span className="ml-1 font-medium">{calculateAverageRating()}</span>
                                <span className="ml-1 text-gray-600">({reviews.length} reviews)</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Review Form */}
            {!isSubmitted && !showReviewForm && (
                <div className="mb-6">
                    <button
                        onClick={() => setShowReviewForm(true)}
                        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                        Write a Review
                    </button>
                </div>
            )}

            {showReviewForm && !isSubmitted && (
                <div className="mb-6">
                    <h3 className="text-xl font-semibold mb-4">Write Your Review</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="review" className="block text-sm font-medium text-gray-700 mb-2">
                                Your Review:
                            </label>
                            <textarea 
                                id="review"
                                placeholder="Share your experience with this mentor..." 
                                value={reviewText} 
                                onChange={(e) => setReviewText(e.target.value)}
                                required
                                rows="4"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        
                        <div>
                            <label htmlFor="rating" className="block text-sm font-medium text-gray-700 mb-2">
                                Rating (1-5):
                            </label>
                            <div className="flex items-center space-x-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        className={`text-2xl ${
                                            star <= rating ? 'text-yellow-500' : 'text-gray-300'
                                        } hover:text-yellow-400`}
                                    >
                                        ★
                                    </button>
                                ))}
                                <span className="ml-2 text-sm text-gray-600">
                                    {rating > 0 ? `${rating} star${rating > 1 ? 's' : ''}` : 'Select rating'}
                                </span>
                            </div>
                        </div>
                        
                        <div className="flex space-x-3">
                            <button 
                                type="submit" 
                                disabled={loading || !reviewText.trim() || rating === 0}
                                className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400"
                            >
                                {loading ? "Submitting..." : "Submit Review"}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowReviewForm(false)}
                                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}
            
            {error && <p className="text-red-600 mb-4">{error}</p>}
            {success && <p className="text-green-600 mb-4">{success}</p>}
            {isSubmitted && <p className="text-green-600 mb-4">Review submitted successfully!</p>}

            <div>
                <h3 className="text-xl font-semibold mb-4">All Reviews</h3>
                {reviews.length > 0 ? (
                    <div className="space-y-4">
                        {reviews.map((review) => (
                            <div key={review._id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-yellow-500">★</span>
                                        <span className="font-medium">{review.rating}/5</span>
                                    </div>
                                    <span className="text-sm text-gray-500">
                                        {new Date(review.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-gray-700">{review.review}</p>
                                <p className="text-sm text-gray-500 mt-2">
                                    - {review.user?.username || 'Anonymous'}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-600">No reviews yet. Be the first to review this mentor!</p>
                )}
            </div>
        </div>
    );
}