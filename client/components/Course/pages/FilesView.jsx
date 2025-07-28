import {useState,useEffect} from 'react';
import axios from 'axios';
import {ApiUrl} from '../../../configs';

export default function FilesView({courseId,sectionId}){
    const [files,setFiles]=useState([]);
    const [loading,setLoading]=useState(true);
    const [error,setError]=useState(null);
      
    const fetchFiles = async (courseId,sectionId)=>{
        try{
            const res = await axios.get(`${ApiUrl}/files/${courseId}/sections/${sectionId}`);
            setFiles(res.data.data);
            setLoading(false);
        }catch(err){
            console.log(err);
            setError('Failed to fetch files');
            setLoading(false);
        }
    }
     
    useEffect(()=>{
        fetchFiles(courseId,sectionId);
    },[courseId,sectionId]);

    const renderFileContent = (file) => {
        const fileUrl = `${ApiUrl}/uploads/${file.path}`;
        const fileExtension = file.path.split('.').pop().toLowerCase();
        const fileType = file.fileType?.toLowerCase() || fileExtension;
        console.log(fileUrl);
        
        switch(fileType) {
            case 'video':
            case 'mp4':
            case 'webm':
            case 'ogv':
            case 'mov':
            case 'avi':
                return (
                    <video 
                        controls 
                        width="100%" 
                        style={{maxWidth: '800px', height: 'auto'}}
                        onError={(e) => console.error('Video load error:', e)}
                    >
                        <source src={fileUrl} type={`video/${fileExtension}`} />
                        Your browser does not support the video tag.
                        <p>
                            <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                                Download video file
                            </a>
                        </p>
                    </video>
                );
            
            case 'pdf':
                return (
                    <div>
                        <iframe 
                            src={fileUrl} 
                            width="100%" 
                            height="600px"
                            title={file.title}
                            onError={(e) => console.error('PDF load error:', e)}
                        >
                            <p>Your browser does not support PDFs. 
                               <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                                   Download the PDF
                               </a>
                            </p>
                        </iframe>
                        <p>
                            <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                                Open PDF in new tab
                            </a>
                        </p>
                    </div>
                );
            
            case 'image':
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
            case 'webp':
                return (
                    <div>
                        <img 
                            src={fileUrl} 
                            alt={file.title}
                            style={{maxWidth: '100%', height: 'auto'}}
                            onError={(e) => {
                                console.error('Image load error:', e);
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'block';
                            }}
                        />
                        <div style={{display: 'none'}}>
                            <p>Image failed to load</p>
                            <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                                Download image: {file.title}
                            </a>
                        </div>
                    </div>
                );
            
            case 'audio':
            case 'mp3':
            case 'wav':
            case 'ogg':
                return (
                    <div>
                        <audio 
                            controls 
                            style={{width: '100%'}}
                            onError={(e) => console.error('Audio load error:', e)}
                        >
                            <source src={fileUrl} type={`audio/${fileExtension}`} />
                            Your browser does not support the audio tag.
                            <p>
                                <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                                    Download audio file
                                </a>
                            </p>
                        </audio>
                    </div>
                );
            
            default:
                return (
                    <div>
                        <p>File type: {fileType}</p>
                        <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                            Download: {file.title}
                        </a>
                    </div>
                );
        }
    };
     
    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
     
    return(
        <div style={{padding: '20px'}}>
            <h1>Files</h1>
            {files.length === 0 ? (
                <p>No files found for this section.</p>
            ) : (
                <div>
                    {files.map((file) => (
                        <div key={file._id} style={{
                            marginBottom: '30px', 
                            padding: '20px', 
                            border: '1px solid #ddd', 
                            borderRadius: '8px'
                        }}>
                            <h2>{file.title}</h2>
                            <p><strong>File Type:</strong> {file.fileType}</p>
                            <p><strong>Uploaded By:</strong> {file.uploadedBy}</p>
                            <p><strong>File Path:</strong> {file.path}</p>
                            
                            <div style={{marginTop: '15px'}}>
                                {renderFileContent(file)}
                            </div>
                        </div>                              
                    ))}
                </div>
            )}
        </div>
    )
}