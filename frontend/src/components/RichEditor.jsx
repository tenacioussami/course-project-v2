import { useMemo } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import api from '../services/api';
import { toast } from './Toast';

// Loaded lazily (only when the Literature editor opens) because Quill is large.
const RichEditor = ({ value, onChange }) => {
  const modules = useMemo(() => {
    const imageHandler = function () {
      const input = document.createElement('input');
      input.setAttribute('type', 'file');
      input.setAttribute('accept', 'image/*');
      input.click();
      input.onchange = async () => {
        const selected = input.files[0];
        if (!selected) return;
        const fd = new FormData();
        fd.append('image', selected);
        try {
          const res = await api.post('/upload/image', fd);
          const quill = this.quill;
          const range = quill.getSelection(true);
          quill.insertEmbed(range.index, 'image', res.data.url);
          quill.setSelection(range.index + 1);
        } catch {
          toast.error('Image upload failed');
        }
      };
    };
    return {
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['link', 'image'],
          ['clean'],
        ],
        handlers: { image: imageHandler },
      },
    };
  }, []);

  return <ReactQuill theme="snow" value={value || ''} onChange={onChange} modules={modules} />;
};

export default RichEditor;
