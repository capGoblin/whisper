"use client";

import * as React from "react";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { processFile } from "@/utils/file-processing";
import { inscribeFile } from "@/utils/hedera";

interface FileUploadProps extends React.HTMLAttributes<HTMLDivElement> {
  onUpload?: (
    files: { topicId: string; fileName: string; fileType: string }[]
  ) => void;
  privateKey?: string;
  publicKey?: string;
  sdk?: any; // HashinalsWalletConnectSDK instance
  className?: string;
}

export function FileUpload({
  onUpload,
  privateKey,
  publicKey,
  sdk,
  className,
  ...props
}: FileUploadProps) {
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [processingProgress, setProcessingProgress] = React.useState<number>(0);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const validateAndAddFiles = (files: File[]) => {
    const validFiles = files.filter((file) => {
      const isImage = file.type.startsWith("image/");
      const isPDF = file.type === "application/pdf";
      return isImage || isPDF;
    });

    // Add new files to existing selection
    setSelectedFiles((prev) => {
      const newFiles = validFiles.filter(
        (newFile) =>
          !prev.some(
            (existingFile) =>
              existingFile.name === newFile.name &&
              existingFile.size === newFile.size
          )
      );
      return [...prev, ...newFiles];
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    validateAndAddFiles(files);
  };

  const handleUpload = async () => {
    if (selectedFiles.length > 0 && onUpload) {
      try {
        console.log(
          "Starting upload process for",
          selectedFiles.length,
          "files"
        );
        setIsProcessing(true);
        const processedFiles = [];

        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          console.log(
            `Processing file ${i + 1}/${selectedFiles.length}:`,
            file.name
          );
          setProcessingProgress(Math.round((i / selectedFiles.length) * 100));

          if (!privateKey) {
            throw new Error("Private key is required for file encryption");
          }

          // Compress and encrypt the file
          const processedData = await processFile(file, privateKey, publicKey);

          // Upload to Hedera and get topic ID
          console.log("Uploading processed file to Hedera...");
          const topicId = await inscribeFile(
            processedData,
            file.name,
            file.type,
            sdk
          );
          console.log("Got topic ID:", topicId);

          processedFiles.push({
            topicId,
            fileName: file.name,
            fileType: file.type,
          });
          console.log("File processed successfully:", {
            fileName: file.name,
            fileType: file.type,
            topicId: topicId,
          });
        }

        setProcessingProgress(100);
        console.log("All files processed successfully:", processedFiles);
        onUpload(processedFiles);

        // Clear the selection after successful upload
        clearFiles();
        console.log("Upload completed and form cleared");
      } catch (error) {
        console.error("Error processing files:", error);
      } finally {
        setIsProcessing(false);
        setProcessingProgress(0);
      }
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    validateAndAddFiles(files);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearFiles = () => {
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 p-6 border-2 border-dashed rounded-lg",
        className
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      {...props}
    >
      <div className="text-center">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*,.pdf"
          multiple
          className="hidden"
        />
        <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
          Select Files
        </Button>
        <p className="mt-2 text-sm text-gray-600">
          or drag and drop files here
        </p>
        <p className="text-xs text-gray-500">
          Supported files: Images and PDFs
        </p>
      </div>

      {selectedFiles.length > 0 && (
        <div className="w-full">
          <div className="mb-4">
            <h4 className="text-sm font-medium">Selected Files:</h4>
            <ul className="mt-2 space-y-2">
              {selectedFiles.map((file, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{file.name}</span>
                    <span className="text-xs text-gray-400">
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="h-6 px-2 text-red-500 hover:text-red-700"
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleUpload}
              className="flex-1"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>Processing... {processingProgress}%</>
              ) : (
                <>
                  Upload {selectedFiles.length}{" "}
                  {selectedFiles.length === 1 ? "File" : "Files"}
                </>
              )}
            </Button>
            <Button variant="outline" onClick={clearFiles} className="px-3">
              Clear All
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
