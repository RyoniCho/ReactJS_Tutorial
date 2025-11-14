import React, { useState, useEffect } from 'react';
import Config from './Config';

const getPreviewUrl = (src) => {
    console.log("EditableImage getPreviewUrl src:"+src);
    if (!src) return '';
    if (src.startsWith('http://') || src.startsWith('https://')) return src;
    if (src.startsWith('uploads/')) return `${Config.apiUrl}/${src}`;
    return src;
};

const EditableImage = ({ src, onChange, onRemove, label }) => {
    const [url, setUrl] = useState(src || '');
    const [file, setFile] = useState(null);

    useEffect(() => {
        setUrl(src || '');
    }, [src]);

    const handleUrlChange = (e) => {
        setUrl(e.target.value);
        setFile(null);
        onChange(e.target.value, null);
    };

    const handleFileChange = (e) => {
        const fileObj = e.target.files[0];
        setFile(fileObj);
        setUrl('');
        onChange('', fileObj);
    };

    return (
        <div style={{ marginBottom: 8 }}>
            {label && <div>{label}</div>}
            {url && <img src={getPreviewUrl(url)} alt="preview" style={{ maxWidth: 120, maxHeight: 120, display: 'block', marginBottom: 4 }} />}
            {file && <div>파일 업로드됨: {file.name}</div>}
            <input type="text" placeholder="이미지 URL 입력" value={url} onChange={handleUrlChange} style={{ marginRight: 4 }} />
            <input type="file" accept="image/*" onChange={handleFileChange} />
            {onRemove && <button type="button" onClick={onRemove} style={{ marginLeft: 4 }}>삭제</button>}
        </div>
    );
};

export default EditableImage;
