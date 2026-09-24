import { useState } from 'react';
import { UploadCloud, CheckCircle2, XCircle } from 'lucide-react';

// Controlled file input with a lightweight preview / status.
// Parent owns the actual upload (as part of form submit) — this just
// captures the File object via onFileSelect.
const FileUpload = ({ label = 'Upload file', accept, onFileSelect, existingUrl }) => {
  const [fileName, setFileName] = useState('');
  const [status, setStatus] = useState(null); // 'selected' | 'error'

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setStatus('selected');
    onFileSelect(file);
  };

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-gray-300 px-4 py-3 hover:border-brand-500">
        <UploadCloud size={18} className="text-gray-400" />
        <span className="text-sm text-gray-500">{fileName || 'Choose a file...'}</span>
        <input type="file" accept={accept} className="hidden" onChange={handleChange} />
      </label>
      {status === 'selected' && (
        <p className="mt-1 flex items-center gap-1 text-xs text-green-600">
          <CheckCircle2 size={14} /> Ready to upload
        </p>
      )}
      {status === 'error' && (
        <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
          <XCircle size={14} /> Upload failed
        </p>
      )}
      {existingUrl && !fileName && (
        <a href={existingUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-brand-600 underline">
          View current file
        </a>
      )}
    </div>
  );
};

export default FileUpload;
