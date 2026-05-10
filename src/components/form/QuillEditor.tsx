'use client';

import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), {
  ssr: false,
  loading: () => <div className="h-[200px] w-full bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg" />,
});

interface QuillEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ color: [] }, { background: [] }],
    ['link', 'image'],
    ['clean'],
  ],
};

const formats = [
  'header',
  'bold',
  'italic',
  'underline',
  'strike',
  'list',
  'color',
  'background',
  'link',
  'image',
];

export default function QuillEditor({ value, onChange, placeholder, className }: QuillEditorProps) {
  const handleChange = (content: string, delta: any, source: string) => {
    if (source === 'user') {
      onChange(content);
    }
  };

  return (
    <div className={`quill-editor-wrapper ${className || ''}`}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={handleChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
      <style jsx global>{`
        .quill-editor-wrapper .ql-toolbar {
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
          background: #f9fafb;
          border-color: #e5e7eb;
        }
        .dark .quill-editor-wrapper .ql-toolbar {
          background: #1f2937;
          border-color: #374151;
        }
        .quill-editor-wrapper .ql-container {
          border-bottom-left-radius: 0.5rem;
          border-bottom-right-radius: 0.5rem;
          min-height: 200px;
          font-size: 0.875rem;
          border-color: #e5e7eb;
        }
        .dark .quill-editor-wrapper .ql-container {
          border-color: #374151;
          color: #f3f4f6;
        }
        .quill-editor-wrapper .ql-editor.ql-blank::before {
          color: #9ca3af;
          font-style: normal;
        }
        .quill-editor-wrapper .ql-stroke {
          stroke: #374151;
        }
        .dark .quill-editor-wrapper .ql-stroke {
          stroke: #9ca3af;
        }
        .quill-editor-wrapper .ql-fill {
          fill: #374151;
        }
        .dark .quill-editor-wrapper .ql-fill {
          fill: #9ca3af;
        }
        .quill-editor-wrapper .ql-picker {
          color: #374151;
        }
        .dark .quill-editor-wrapper .ql-picker {
          color: #9ca3af;
        }
        .dark .quill-editor-wrapper .ql-picker-options {
          background-color: #1f2937;
          border-color: #374151;
        }
      `}</style>
    </div>
  );
}
