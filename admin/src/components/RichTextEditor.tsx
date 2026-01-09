'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
import './RichTextEditor.css'; // We will create this for custom overrides if needed

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    label?: string;
    className?: string;
}

export function RichTextEditor({ value, onChange, label, className = '' }: RichTextEditorProps) {
    const ReactQuill = useMemo(() => dynamic(() => import('react-quill-new'), { ssr: false }), []);

    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{'list': 'ordered'}, {'list': 'bullet'}],
            ['link', 'image'],
            ['clean']
        ],
    };

    const formats = [
        'header',
        'bold', 'italic', 'underline', 'strike', 'blockquote',
        'list', 'bullet',
        'link', 'image'
    ];

    return (
        <div className={`w-full ${className}`}>
            {label && <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>}
            <div className="bg-white">
                <ReactQuill 
                    theme="snow"
                    value={value || ''}
                    onChange={onChange}
                    modules={modules}
                    formats={formats}
                    className="h-64 mb-12" // mb-12 to account for toolbar height if needed? No, quill toolbar is top. h-64 is content height.
                />
            </div>
        </div>
    );
}
