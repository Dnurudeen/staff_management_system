import { useState, useRef } from "react";
import {
    CloudArrowUpIcon,
    XMarkIcon,
    DocumentIcon,
} from "@heroicons/react/24/outline";

export default function FileUpload({
    onFileSelect,
    accept = "*",
    maxSize = 10485760, // 10MB default
    multiple = false,
    className = "",
    label = "Upload File",
    showPreview = true,
}) {
    const [files, setFiles] = useState([]);
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState("");
    const inputRef = useRef(null);

    const validateFile = (file) => {
        if (file.size > maxSize) {
            setError(`File size exceeds ${(maxSize / 1048576).toFixed(2)}MB`);
            return false;
        }
        setError("");
        return true;
    };

    const handleFiles = (fileList) => {
        const validFiles = Array.from(fileList).filter(validateFile);

        if (validFiles.length > 0) {
            const newFiles = multiple ? [...files, ...validFiles] : validFiles;
            setFiles(newFiles);
            onFileSelect(multiple ? newFiles : newFiles[0]);
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFiles(e.dataTransfer.files);
        }
    };

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFiles(e.target.files);
        }
    };

    const removeFile = (index) => {
        const newFiles = files.filter((_, i) => i !== index);
        setFiles(newFiles);
        onFileSelect(multiple ? newFiles : null);
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return (
            Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
        );
    };

    return (
        <div className={className}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                {label}
            </label>

            <div
                className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
                    dragActive
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-300 hover:border-gray-400"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    accept={accept}
                    multiple={multiple}
                    onChange={handleChange}
                />

                <div className="text-center">
                    <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4 flex text-sm text-gray-600">
                        <button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                        >
                            <span>Upload a file</span>
                        </button>
                        <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        Max size: {(maxSize / 1048576).toFixed(2)}MB
                    </p>
                </div>
            </div>

            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

            {showPreview && files.length > 0 && (
                <div className="mt-4 space-y-2">
                    {files.map((file, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                            <div className="flex items-center space-x-3">
                                {file.type.startsWith("image/") ? (
                                    <img
                                        src={URL.createObjectURL(file)}
                                        alt={file.name}
                                        className="h-10 w-10 object-cover rounded"
                                    />
                                ) : (
                                    <DocumentIcon className="h-10 w-10 text-gray-400" />
                                )}
                                <div>
                                    <p className="text-sm font-medium text-gray-900">
                                        {file.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {formatFileSize(file.size)}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => removeFile(index)}
                                className="text-red-600 hover:text-red-800"
                            >
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
