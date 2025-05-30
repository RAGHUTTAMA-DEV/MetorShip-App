import ReviewModel from "../models/ReviewModel";

export async function createReview(req,res){
    try{
       const {bookingId,review,rating,mentor,reviewedBy} = req.body
       const ismentor = await User.findById(mentor);
       if(!ismentor) return res.status(404).json({message: "Mentor not found"})

       const isreviewed = await User.findById(reviewedBy);
       if(!isreviewed) return res.status(404).json({message: "User not found"})

        await ReviewModel.create({bookingId,review,rating,mentor,reviewedBy});

        res.status(200).json({message: "Review created successfully"})
    }catch(err){
        res.status(500).json({message: err.message})
    }
}

export async function getReview(req,res){
    try{
        const reviews = await ReviewModel.find().populate("bookingId").populate("mentor").populate("reviewedBy");
        res.status(200).json(reviews);
    }catch(err){
        res.status(500).json({message: err.message});
    }
}