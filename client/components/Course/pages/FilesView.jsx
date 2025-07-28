

export default function FilesView({courseId,sectionId}){
    const [files,setFiles]=useState([]);
    const [loading,setLoading]=useState(true);


    const fetchFiles = async (courseId,sectionId)=>{
        try{

        }catch(err){
            console.log(err);
        }finally{
            setLoading(false);
        }
    }
    return(
        <div>
            <h1>FilesView</h1>
        </div>
    )
}