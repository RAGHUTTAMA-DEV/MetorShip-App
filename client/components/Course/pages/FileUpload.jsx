import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../../context/AuthContext";
import toast from "react-hot-toast";
import { ApiUrl } from "../../../configs";

export default function FileUpload({ courseId, sectionId }) {
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null); // for browser preview
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [filepath,SetFilepath] = useState('');
  const { token, user } = useAuth();

  const fileBrowserHandler = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile); // real file object for Multer
      setFilePreview(URL.createObjectURL(selectedFile)); 
      SetFilepath(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setError('Please select a file');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file); // ✅ this is the key Multer expects
      formData.append('title', title);
      formData.append('description', description);
      formData.append('uploadedBy', user._id || user.id);
      formData.append('fileType', file.name.split('.').pop());
      formData.append('path', filePreview); 

      const res = await axios.post(
        `${ApiUrl}/files/${courseId}/sections/${sectionId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      toast.success('File uploaded successfully');
      setUploadedFiles((prev) => [...prev, res.data.data]);
      setFile(null);
      setFilePreview(null);
      setTitle('');
      setDescription('');
      setError('');
      document.getElementById("file").value = "";
    } catch (err) {
      console.error(err);
      toast.error('Upload failed');
    }
  };

  return (
    <div>
      <h3>Upload File</h3>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="file">Select File</label>
          <input
            type="file"
            id="file"
            name="file"
            onChange={fileBrowserHandler}
            required
          />
        </div>

        {filePreview && (
          <div style={{ margin: "10px 0" }}>
            <strong>Preview:</strong><br />
            {file?.type?.startsWith("image/") ? (
              <img src={filePreview} alt="preview" width="150" />
            ) : (
              <a href={filePreview} target="_blank" rel="noreferrer">Open File Preview</a>
            )}
          </div>
        )}

        <div>
          <label htmlFor="title">Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          ></textarea>
        </div>

        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit">Upload</button>
      </form>

      <div>
        <h4>Uploaded Files</h4>
        <ul>
          {uploadedFiles.map((f) => (
            <li key={f._id}>
              <a href={f.path} target="_blank" rel="noopener noreferrer">
                {f.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
