'use client';

import { useState, useRef } from 'react';
import { Bold, Italic, Link as LinkIcon, Image as ImageIcon, Loader2, Eye, Edit2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface MarkdownEditorProps {
    value: string;
    onChange: (value: string) => void;
    label?: string;
}

export function MarkdownEditor({ value, onChange, label = "Content" }: MarkdownEditorProps) {
    const supabase = createClient();
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [insertingImage, setInsertingImage] = useState(false);
    const contentInputRef = useRef<HTMLTextAreaElement>(null);
    const imageUploadRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        if (file.size > 5 * 1024 * 1024) {
            alert('Image must be less than 5MB');
            return;
        }

        setInsertingImage(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `editor-content-${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('images').upload(fileName, file);
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(fileName);
            
            insertText(`![${file.name}](${publicUrl})`);
        } catch (err) {
            console.error(err);
            alert('Failed to upload image');
        } finally {
            setInsertingImage(false);
            if (imageUploadRef.current) imageUploadRef.current.value = '';
        }
    };

    const insertText = (textToInsert: string) => {
        const textarea = contentInputRef.current;
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const text = value;
            const newText = text.substring(0, start) + textToInsert + text.substring(end);
            onChange(newText);
        } else {
            onChange(value + textToInsert);
        }
    };

    const insertMarkdown = (syntax: string, placeholder: string = '') => {
        const textarea = contentInputRef.current;
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = value;
        const selected = text.substring(start, end) || placeholder;
        const insertion = syntax.replace('$1', selected);
        const newText = text.substring(0, start) + insertion + text.substring(end);
        onChange(newText);
        textarea.focus();
    };

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">{label}</label>
                <div className="flex items-center space-x-2">
                    <button type="button" onClick={() => setIsPreviewMode(!isPreviewMode)} className="flex items-center text-xs text-gray-600 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-100">
                        {isPreviewMode ? <Edit2 className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                        {isPreviewMode ? 'Edit' : 'Preview'}
                    </button>
                </div>
            </div>
            {!isPreviewMode ? (
                <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
                    <div className="flex items-center gap-1 p-2 border-b bg-gray-50 overflow-x-auto">
                         <button type="button" onClick={() => insertMarkdown('**$1**', 'bold')} className="p-1.5 hover:bg-gray-200 rounded text-gray-700" title="Bold"><Bold className="w-4 h-4" /></button>
                         <button type="button" onClick={() => insertMarkdown('*$1*', 'italic')} className="p-1.5 hover:bg-gray-200 rounded text-gray-700" title="Italic"><Italic className="w-4 h-4" /></button>
                         <div className="w-px h-4 bg-gray-300 mx-1" />
                         <button type="button" onClick={() => insertMarkdown('[$1](url)', 'link')} className="p-1.5 hover:bg-gray-200 rounded text-gray-700" title="Link"><LinkIcon className="w-4 h-4" /></button>
                         <button type="button" onClick={() => imageUploadRef.current?.click()} className="p-1.5 hover:bg-gray-200 rounded text-gray-700" title="Insert Image" disabled={insertingImage}>
                             {insertingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                         </button>
                    </div>
                    <textarea ref={contentInputRef} value={value} onChange={(e) => onChange(e.target.value)} rows={12} className="w-full px-3 py-2 focus:outline-none focus:ring-0 text-gray-900 font-mono text-sm resize-y min-h-[200px]" placeholder="Type your content here... Markdown supported." />
                    <input ref={imageUploadRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </div>
            ) : (
                <div className="prose prose-sm max-w-none p-4 border border-gray-200 rounded-lg bg-gray-50 min-h-[200px]">
                    {value ? <div className="whitespace-pre-wrap">{value}</div> : <p className="text-gray-400 italic">No content</p>}
                </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
                Use Markdown for formatting. Images can be uploaded via the toolbar.
            </p>
        </div>
    );
}
