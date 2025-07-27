import SectionModel from "../../models/Course/SectionModel"

export async function CreateSection(req,res){
   try{ 
       const {courseId,title,order,videoUrl,noteUrl}=req.body;
       const section =await SectionModel.create(req.body);
       if(!section){
           res.status(400).json({message:"Section not created"})
       }
       res.status(200).json({message:"Section created successfully",section})

   }catch(err){
       res.status(500).json({message:err.message})
   }
}


export async function GetSection(req,res){
   try{
    const {courseId}=req.params;
    const section =await SectionModel.find({courseId:courseId});
    if(!section){
        res.status(400).json({message:"Section not found"})
    }
    res.status(200).json({message:"Section found successfully",section})

   }catch(err){
       res.status(500).json({message:err.message})
   }
}

export async function UpdateSection(req,res){
    try{

        const data=req.body;
        const {sectionId}=req.params;
        const section =await SectionModel.findByIdAndUpdate(sectionId,data);    
        if(!section){
            res.status(400).json({message:"Section not updated"})
        }
        res.status(200).json({message:"Section updated successfully",section})
    }catch(err){
         res.status(500).json({message:err.message})
    }
}

export async function DeleteSection(req,res){
   try{
    const {sectionId}=req.params;
    const section =await SectionModel.findByIdAndDelete(sectionId);    
    if(!section){
        res.status(400).json({message:"Section not deleted"})
    }
    res.status(200).json({message:"Section deleted successfully"})

   }catch(err){
       res.status(500).json({message:err.message})
   }
}