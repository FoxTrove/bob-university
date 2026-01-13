declare module 'react-quill-new' {
    import React from 'react';
    export interface ReactQuillProps {
        theme?: string;
        modules?: Record<string, unknown>;
        formats?: string[];
        value?: string;
        onChange?: (value: string) => void;
        className?: string;
        placeholder?: string;
    }
    export default class ReactQuill extends React.Component<ReactQuillProps> {}
}
