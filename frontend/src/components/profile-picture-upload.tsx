/**
 * Profile Picture Upload Component
 * Allows students to upload and update their profile picture
 */

import { useState, useRef } from "react";
import { Upload, X, Camera, User } from "lucide-react";
import { uploadProfilePicture } from "@/lib/server/oasis";
import { pushToast } from "@/lib/toast";

interface ProfilePictureUploadProps {
  studentId: string;
  currentPictureUrl?: string | null;
  onSuccess?: (newUrl: string) => void;
}

export function ProfilePictureUpload({ studentId, currentPictureUrl, onSuccess }: ProfilePictureUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      pushToast("err", "Please select an image file (JPG, PNG, or WebP)");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      pushToast("err", "Image must be less than 5MB");
      return;
    }

    setSelectedFile(file);

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        
        try {
          const result = await uploadProfilePicture({
            data: {
              studentId,
              imageBase64: base64,
              fileName: selectedFile.name,
            },
          });

          pushToast("ok", "✅ Profile picture updated!");
          if (onSuccess) onSuccess(result.url);
          
          // Clear preview
          setPreview(null);
          setSelectedFile(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        } catch (error) {
          console.error("Upload error:", error);
          pushToast("err", error instanceof Error ? error.message : "Upload failed");
        } finally {
          setUploading(false);
        }
      };
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      console.error("Upload error:", error);
      pushToast("err", "Failed to process image");
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setPreview(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const displayUrl = preview || currentPictureUrl;

  return (
    <div className="space-y-4">
      {/* Profile Picture Display */}
      <div className="flex justify-center">
        <div className="relative">
          <div className="size-32 rounded-full overflow-hidden bg-gradient-to-br from-sky-100 to-cyan-100 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center shadow-lg ring-4 ring-white dark:ring-slate-800">
            {displayUrl ? (
              <img src={displayUrl} alt="Profile" className="size-full object-cover" />
            ) : (
              <User className="size-16 text-sky-400 dark:text-slate-400" />
            )}
          </div>
          
          {/* Camera Button */}
          {!preview && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 size-10 rounded-full bg-gradient-to-r from-sky-600 to-cyan-600 text-white shadow-lg hover:shadow-xl hover:scale-110 transition-all flex items-center justify-center disabled:opacity-50 ring-4 ring-white dark:ring-slate-800"
              aria-label="Change picture"
            >
              <Camera className="size-5" />
            </button>
          )}
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload Controls (shown when file selected) */}
      {preview && selectedFile && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading}
              className="flex-1 h-11 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="size-4" />
                  Upload Photo
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={handleCancel}
              disabled={uploading}
              className="h-11 px-4 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-ink dark:text-white font-semibold transition-all disabled:opacity-60 flex items-center justify-center"
              aria-label="Cancel"
            >
              <X className="size-4" />
            </button>
          </div>
          
          <p className="text-xs text-center text-muted dark:text-slate-400">
            Review your photo and click Upload
          </p>
        </div>
      )}

      {/* Help Text */}
      {!preview && (
        <p className="text-xs text-center text-muted dark:text-slate-400">
          Click camera icon to {currentPictureUrl ? "change" : "add"} picture
          <br />
          <span className="text-[10px]">Max 5MB • JPG, PNG, or WebP</span>
        </p>
      )}
    </div>
  );
}

/**
 * Compact Profile Picture Display (for headers, cards, etc.)
 */
interface ProfilePictureDisplayProps {
  pictureUrl?: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ProfilePictureDisplay({ pictureUrl, name, size = "md", className = "" }: ProfilePictureDisplayProps) {
  const sizeClasses = {
    sm: "size-8",
    md: "size-12",
    lg: "size-16",
  };

  const iconSizes = {
    sm: "size-4",
    md: "size-6",
    lg: "size-8",
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gradient-to-br from-sky-100 to-cyan-100 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center shadow-md ${className}`}
      title={name}
    >
      {pictureUrl ? (
        <img src={pictureUrl} alt={name} className="size-full object-cover" />
      ) : (
        <User className={`${iconSizes[size]} text-sky-400 dark:text-slate-400`} />
      )}
    </div>
  );
}
