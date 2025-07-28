import CourseModel from "../../models/Course/CourseModel.js";
import SectionModel from "../../models/Course/SectionModel.js";
export async function CreateCourse(req,res){
   try{
    const {title,description,price,instructor,isActive,category,tags,thumbnail}=req.body;

    const course =await CourseModel.create({
        title,
        description,
        price,
        instructor,
        isActive,
        category,
        tags,
        thumbnail,
    })

    if(!course){
        res.status(400).json({
            message:"Course not created",
            success:false,
        });
    }
    
    res.status(200).json({
        message:"Course created successfully",
        success:true,
        data:course,
    })

   }catch(err){
       res.status(500).json({
           message:err.message,
           success:false,
       })
   }
}



export async function GetAllCourses(req,res){
       try{
        const courses = await CourseModel.find();
        if(!courses){
            res.status(400).json({
                message:"No courses found",
                success:false,
            });
        }

        res.status(200).json({
            message:"Courses fetched successfully",
            success:true,
            data:courses,
        })
       }catch(err){
           res.status(500).json({
               message:err.message,
               success:false,
           })
       }
}


export async function GetCourseById(req,res){
     try{
         const course =await CourseModel.findById(req.params.id);
         if(!course){
             res.status(400).json({
                 message:"Course not found",
                 success:false,
             })
         }

        res.status(200).json({
             message:"Course fetched successfully",
             success:true,
             data:course,
         });
     }catch(err){
         res.status(500).json({
             message:err.message,
             success:false,
         })
     }
}

export async function UpdateCourse(req,res){
      try{
           const data =req.body;
           const course =await CourseModel.findByIdAndUpdate(req.params.id,data);
           if(!course){
               res.status(400).json({
                   message:"Course not found",
                   success:false,
               })
           }

           res.status(200).json({
               message:"Course updated successfully",
               success:true,
               data:course,
           })
      }catch(err){
          res.status(500).json({
              message:err.message,
              success:false,
          })
      }
}

export async function DeleteCourse(req,res){
    try{
         const course =await CourseModel.findByIdAndDelete(req.params.id);
         
         if(!course){
             res.status(400).json({
                 message:"Course not found",
                 success:false,
             })
         }

         res.status(200).json({
             message:"Course deleted successfully",
             success:true,
         })

    }catch(err){
        res.status(500).json({
            message:err.message,
            success:false,
        })
    }
    
}

export async function GetCourseSections(req,res){
    try{
       const {courseId}=req.params;
       const sections=await SectionModel.find({courseId:courseId});
       res.status(200).json({
           message:"Sections fetched successfully",
           success:true,
           data:sections,
       })
    }catch(err){
        res.status(500).json({
            message:err.message,
            success:false,
        })
    }
}

export async function GetMyCourse(req,res){
    try{ 
        const mentorId =req.user._id;
        const courses =await CourseModel.find({instructorId:mentorId});
        if(!courses){
             res.status(400).json({
                 message:"Courses not found",
                 success:false,
             })
        }
        res.status(200).json({
            message:"Courses fetched successfully",
            success:true,
            data:courses,
        })
    }catch(err){
        res.status(500).json({
            message:err.message,
            success:false,
        })
    }
}