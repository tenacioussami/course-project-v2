import { useState } from 'react';
import { UploadCloud, CheckCircle2, ExternalLink } from 'lucide-react';

// Controlled file input with a lightweight preview / status.
// Parent owns the actual upload (as part of form submit) — this just
// captures the File object via onFileSelect.
const FileUpload = ({ label = 'Upload file', accept, onFileSelect, existingUrl }) => {
  const [fileName, setFileName] = useState('');

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    onFileSelect(file);
  };

  return (
    <div>
      <label className="label">{label}</label>
      <label className="group flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-3.5 transition hover:border-cyan-400/50 hover:bg-cyan-400/[0.04]">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.05] text-slate-400 transition group-hover:text-cyan-300">
          <UploadCloud size={18} />
        </span>
        <span className="truncate text-sm text-slate-400">{fileName || 'Click to choose a file…'}</span>
        <input type="file" accept={accept} className="hidden" onChange={handleChange} />
      </label>
      {fileName && (
        <p className="mt-1.5 flex items-center gap-1 text-xs text-emerald-300">
          <CheckCircle2 size={13} /> Ready to upload
        </p>
      )}
      {existingUrl && !fileName && (
        <a href={existingUrl} target="_blank" rel="noreferrer" className="mt-1.5 inline-flex items-center gap-1 text-xs text-cyan-300 hover:underline">
          View current file <ExternalLink size={11} />
        </a>
      )}
    </div>
  );
};

export default FileUpload;
