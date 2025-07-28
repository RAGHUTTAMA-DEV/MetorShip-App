import CourseModel from "../../models/Course/CourseModel.js";
export async function PurchaseCourse(req,res){
    try{
      const {courseId,paymentId,amont,purchaseStatus} = req.body;     
      const user =req.user;
      const course = await CourseModel.findById(courseId);
      if(!course){
        return res.status(404).json({message: "Course not found"});
      }
      if (course.purchasedBy && course.purchasedBy.includes(user._id)) {
        return res.status(400).json({message: "You have already purchased this course."});
      }
      const purchasedCourse = await CourseModel.findByIdAndUpdate(courseId,{
          $push:{
              purchasedBy:user._id,
          },
          $set:{
              purchaseStatus,
          }
      }, { new: true });
      res.status(200).json({message:"Course Purchased Successfully",paymentId,amont,purchaseStatus,purchasedCourse})
    }catch(err){
        res.status(500).json({error:err.message})
    }
}

export async function GetPurchasedCourses(req,res){
     try{
        const user = req.user;
        const courses = await CourseModel.find({purchasedBy:user._id});
        res.status(200).json({data: courses})
     }catch(err){
        res.status(500).json({error:err.message})
     }
}

export async function GetPurchasedCourseById(req,res){
     try{
        const user = req.user;
        const course = await CourseModel.findById(req.params.id);
        if(course.purchasedBy.includes(user._id)){
            res.status(200).json({course})
        }else{
            res.status(404).json({message:"Course not found"})
        }
     }catch(err){
        res.status(500).json({error:err.message})
     }
}

