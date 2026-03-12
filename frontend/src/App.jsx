import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { UploadCloud, File, FileText, Image as ImageIcon, Film, Music, Archive, Code, Download, Trash2, RefreshCw, Folder, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const API_BASE = 'http://localhost:5555/api'; // Useful for dev, empty for prod if served from same host
const FILE_BASE = 'http://localhost:5555/file';

// In production (bundled), the API is on exactly the same host.
const getApiUrl = (endpoint) => {
  if (import.meta.env.DEV) {
    return `${API_BASE}${endpoint}`;
  }
  return `/api${endpoint}`;
};

const getFileUrl = (filename) => {
  if (import.meta.env.DEV) {
    return `${FILE_BASE}/${encodeURIComponent(filename)}`;
  }
  return `/file/${encodeURIComponent(filename)}`;
};

function App() {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [networkUrl, setNetworkUrl] = useState('');
  const [showQR, setShowQR] = useState(false);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(getApiUrl('/files'));
      setFiles(response.data.files || []);
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();

    // Fetch local network URL for QR Code
    axios.get(getApiUrl('/network-info'))
      .then(res => {
        if (res.data && res.data.url) {
          setNetworkUrl(res.data.url);
        }
      })
      .catch(err => console.error('Could not fetch network info', err));
  }, [fetchFiles]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await uploadFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      await uploadFiles(e.target.files);
    }
  };

  const uploadFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    for (let i = 0; i < fileList.length; i++) {
        formData.append('file', fileList[i]);
    }

    try {
      await axios.post(getApiUrl('/upload'), formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });
      fetchFiles();
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Upload failed.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (filename) => {
    if (!window.confirm(`Are you sure you want to delete ${filename}?`)) return;

    try {
      await axios.delete(getApiUrl(`/delete/${encodeURIComponent(filename)}`));
      fetchFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Delete failed.');
    }
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const getFileIcon = (filename) => {
    const parts = filename.split('.');
    if (parts.length === 1) return <File size={32} />; // No extension
    const ext = parts.pop().toLowerCase();
    switch (ext) {
      case 'jpg': case 'jpeg': case 'png': case 'gif': case 'svg': case 'webp': case 'ico':
        return <ImageIcon size={32} />;
      case 'mp4': case 'mkv': case 'avi': case 'mov': case 'webm':
        return <Film size={32} />;
      case 'mp3': case 'wav': case 'ogg': case 'flac':
        return <Music size={32} />;
      case 'zip': case 'rar': case 'tar': case 'gz': case '7z':
        return <Archive size={32} />;
      case 'js': case 'jsx': case 'py': case 'html': case 'css': case 'json': case 'ts': case 'tsx':
        return <Code size={32} />;
      case 'txt': case 'pdf': case 'doc': case 'docx': case 'md': case 'csv':
        return <FileText size={32} />;
      default:
        return <File size={32} />;
    }
  };

  return (
    <div className="glass-panel">
      <header className="header" style={{ position: 'relative' }}>
        <Folder />
        <h1>DropZone</h1>
        {networkUrl && (
          <div className="qr-container" style={{ marginLeft: 'auto', position: 'relative' }}>
            <button
              className="refresh-btn"
              onClick={() => setShowQR(!showQR)}
              title="Show QR Code to connect from phone"
            >
              <QrCode size={20} />
            </button>
            {showQR && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '10px',
                background: 'white',
                padding: '12px',
                borderRadius: '8px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                zIndex: 50
              }}>
                <QRCodeSVG value={networkUrl} size={256} />
              </div>
            )}
          </div>
        )}
      </header>

      <div
        className={`upload-zone ${isDragging ? 'drag-active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('fileInput').click()}
      >
        <UploadCloud />
        <p><span className="highlight">Click to upload</span> or drag and drop</p>
        <p style={{ fontSize: '0.8rem' }}>Any file type supported</p>
        <input
          type="file"
          id="fileInput"
          className="file-input"
          multiple
          onChange={handleFileInput}
        />

        {isUploading && (
          <div className="upload-progress">
            <div
              className="progress-bar"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        )}
      </div>

      <div className="file-list-container">
        <div className="file-list-header">
          <h2>Your Files</h2>
          <button className="refresh-btn" onClick={fetchFiles}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {files.length === 0 && !loading ? (
          <div className="empty-state">
            <p>No files uploaded yet. Start by uploading above!</p>
          </div>
        ) : (
          <div className="file-grid">
            {files.map((file) => (
              <div key={file.name} className="file-card">
                <div className="file-info">
                  <div className="file-icon">
                    {getFileIcon(file.name)}
                  </div>
                  <div className="file-details">
                    <span className="file-name" title={file.name}>{file.name}</span>
                    <span className="file-meta">
                      {formatSize(file.size)} • {formatDate(file.modified)}
                    </span>
                  </div>
                </div>
                <div className="file-actions">
                  <a
                    href={getFileUrl(file.name)}
                    download={file.name}
                    className="btn btn-download"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Download size={16} /> Download
                  </a>
                  <button
                    className="btn btn-delete"
                    onClick={(e) => { e.stopPropagation(); handleDelete(file.name); }}
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
