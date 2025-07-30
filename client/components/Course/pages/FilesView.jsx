import { useState, useEffect } from 'react';
import axios from 'axios';
import { ApiUrl } from '../../../configs';

export default function FilesView({ courseId, sectionId }) {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedFile, setExpandedFile] = useState(null);
      
    const fetchFiles = async (courseId, sectionId) => {
        if (!courseId || !sectionId) {
            setError('Course ID or Section ID is missing');
            setLoading(false);
            return;
        }
        
        try {
            const res = await axios.get(`${ApiUrl}/files/${courseId}/sections/${sectionId}`);
            setFiles(res.data.data);
            setLoading(false);
        } catch (err) {
            console.log(err);
            setError('Failed to fetch files');
            setLoading(false);
        }
    }
     
    useEffect(() => {
        fetchFiles(courseId, sectionId);
    }, [courseId, sectionId]);

    const renderFileContent = (file) => {
        if (!file.path) {
            return (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-600 font-medium">File path not available</p>
                    <p className="text-gray-600 text-sm">File: {file.title}</p>
                </div>
            );
        }
        
        const fileUrl = `${ApiUrl}/uploads/${file.path}`;
        const fileExtension = file.path.split('.').pop().toLowerCase();
        const fileType = file.fileType?.toLowerCase() || fileExtension;
        
        switch (fileType) {
            case 'video':
            case 'mp4':
            case 'webm':
            case 'ogv':
            case 'mov':
            case 'avi':
                return (
                    <div className="space-y-2">
                        <video 
                            controls 
                            className="w-full max-w-4xl h-auto rounded-lg shadow-sm"
                            onError={(e) => console.error('Video load error:', e)}
                        >
                            <source src={fileUrl} type={`video/${fileExtension}`} />
                            Your browser does not support the video tag.
                        </video>
                        <a 
                            href={fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
                        >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Download video
                        </a>
                    </div>
                );
            
            case 'pdf':
                return (
                    <div className="space-y-3">
                        <iframe 
                            src={fileUrl} 
                            className="w-full h-96 border border-gray-300 rounded-lg"
                            title={file.title}
                            onError={(e) => console.error('PDF load error:', e)}
                        >
                            <p className="p-4 text-gray-600">
                                Your browser does not support PDFs. 
                                <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                                    Download the PDF
                                </a>
                            </p>
                        </iframe>
                        <a 
                            href={fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
                        >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Open PDF in new tab
                        </a>
                    </div>
                );
            
            case 'image':
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
            case 'webp':
                return (
                    <div className="space-y-2">
                        <img 
                            src={fileUrl} 
                            alt={file.title}
                            className="max-w-full h-auto rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => window.open(fileUrl, '_blank')}
                            onError={(e) => {
                                console.error('Image load error:', e);
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'block';
                            }}
                        />
                        <div className="hidden bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-red-600 font-medium">Image failed to load</p>
                            <a 
                                href={fileUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm"
                            >
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
                    <div className="space-y-2">
                        <audio 
                            controls 
                            className="w-full"
                            onError={(e) => console.error('Audio load error:', e)}
                        >
                            <source src={fileUrl} type={`audio/${fileExtension}`} />
                            Your browser does not support the audio tag.
                        </audio>
                        <a 
                            href={fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
                        >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Download audio
                        </a>
                    </div>
                );
            
            default:
                return (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="font-medium text-gray-700">File type: {fileType}</span>
                        </div>
                        <a 
                            href={fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Download: {file.title}
                        </a>
                    </div>
                );
        }
    };
     
    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading files...</span>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-red-700 font-medium">Error: {error}</span>
                </div>
            </div>
        );
    }
     
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Section Files ({files.length})
                </h4>
            </div>
            
            {files.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No files found</h3>
                    <p className="mt-1 text-sm text-gray-500">Upload files to this section to see them here.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {files.map((file) => (
                        <div key={file._id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                            <div className="p-4 border-b border-gray-200">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h5 className="text-lg font-medium text-gray-900 mb-1">{file.title}</h5>
                                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                                            <span className="flex items-center">
                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                </svg>
                                                {file.fileType}
                                            </span>
                                            <span className="flex items-center">
                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                                {file.uploadedBy}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setExpandedFile(expandedFile === file._id ? null : file._id)}
                                        className="ml-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <svg 
                                            className={`w-5 h-5 transform transition-transform ${expandedFile === file._id ? 'rotate-180' : ''}`} 
                                            fill="none" 
                                            stroke="currentColor" 
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            
                            {expandedFile === file._id && (
                                <div className="p-4">
                                    {renderFileContent(file)}
                                </div>
                            )}
                        </div>                              
                    ))}
                </div>
            )}
        </div>
    );
}