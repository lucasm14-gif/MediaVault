import * as React from "react";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { UploadIcon } from "lucide-react";

interface FileInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  onFilesSelected: (files: File[]) => void;
  maxSize?: number; // in MB
  accept?: string;
  label?: string;
  description?: string;
  error?: string;
  multiple?: boolean;
}

export function FileInput({
  onFilesSelected,
  maxSize = 10,
  accept = "image/*",
  label = "Upload files",
  description = "Drag and drop files here or click to browse",
  error,
  multiple = false,
  className,
  ...props
}: FileInputProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const fileArray = Array.from(files);
    let errorMessage = null;
    
    // Check file size
    for (const file of fileArray) {
      const fileSizeInMB = file.size / (1024 * 1024);
      if (fileSizeInMB > maxSize) {
        errorMessage = `File "${file.name}" exceeds the maximum size of ${maxSize}MB.`;
        break;
      }
    }
    
    setFileError(errorMessage);
    
    if (!errorMessage) {
      setSelectedFiles(multiple ? [...selectedFiles, ...fileArray] : fileArray);
      onFilesSelected(multiple ? [...selectedFiles, ...fileArray] : fileArray);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    handleFileChange(files);
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-gray-700">{label}</label>
          {multiple && selectedFiles.length > 0 && (
            <span className="text-xs text-gray-500">
              {selectedFiles.length} file(s) selected
            </span>
          )}
        </div>
      )}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        className={cn(
          "border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center cursor-pointer transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-gray-300 hover:border-primary",
          error || fileError ? "border-destructive" : ""
        )}
      >
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFileChange(e.target.files)}
          {...props}
        />
        <div className="flex flex-col items-center justify-center text-center space-y-2">
          <UploadIcon className="h-10 w-10 text-gray-400" />
          <div className="font-medium text-sm text-gray-600">{description}</div>
          <div className="text-xs text-gray-500">
            {accept.includes("image") ? "PNG, JPG, GIF" : accept.replace(/\./g, "").toUpperCase()} up to {maxSize}MB
          </div>
          <Button type="button" variant="secondary" size="sm">
            Browse files
          </Button>
        </div>
      </div>
      {(error || fileError) && (
        <div className="text-sm text-destructive">{error || fileError}</div>
      )}
      {multiple && selectedFiles.length > 0 && (
        <div className="mt-2">
          <div className="text-sm font-medium text-gray-700 mb-2">Selected files:</div>
          <ul className="space-y-2">
            {selectedFiles.map((file, index) => (
              <li
                key={index}
                className="flex items-center justify-between text-sm border rounded-md p-2"
              >
                <span className="truncate max-w-[250px]">{file.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    const newFiles = selectedFiles.filter((_, i) => i !== index);
                    setSelectedFiles(newFiles);
                    onFilesSelected(newFiles);
                  }}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
