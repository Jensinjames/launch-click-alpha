// Image Upload Manager - Enhanced Image Support for Content Generation
import React, { useState, useCallback, useRef } from 'react';
import { Upload, X, ImageIcon, File, Loader2 } from '@/lib/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface UploadedImage {
  id: string;
  url: string;
  name: string;
  size: number;
  type: string;
}

interface ImageUploadManagerProps {
  onImagesChange: (images: UploadedImage[]) => void;
  maxImages?: number;
  maxSize?: number; // MB
  allowedTypes?: string[];
  className?: string;
}

export const ImageUploadManager: React.FC<ImageUploadManagerProps> = ({
  onImagesChange,
  maxImages = 5,
  maxSize = 10,
  allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  className = ''
}) => {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    // Validate files
    for (const file of fileArray) {
      if (!allowedTypes.includes(file.type)) {
        toast.error(`Invalid file type: ${file.name}. Allowed types: ${allowedTypes.join(', ')}`);
        return;
      }
      
      if (file.size > maxSize * 1024 * 1024) {
        toast.error(`File too large: ${file.name}. Max size: ${maxSize}MB`);
        return;
      }
    }

    if (images.length + fileArray.length > maxImages) {
      toast.error(`Too many files. Maximum: ${maxImages} images`);
      return;
    }

    setIsUploading(true);

    try {
      const uploadPromises = fileArray.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { data, error } = await supabase.storage
          .from('user-uploads')
          .upload(fileName, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('user-uploads')
          .getPublicUrl(fileName);

        return {
          id: data.path,
          url: publicUrl,
          name: file.name,
          size: file.size,
          type: file.type,
        };
      });

      const uploadedImages = await Promise.all(uploadPromises);
      const newImages = [...images, ...uploadedImages];
      
      setImages(newImages);
      onImagesChange(newImages);
      
      toast.success(`Successfully uploaded ${uploadedImages.length} image(s)`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload images. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, [images, maxImages, maxSize, allowedTypes, onImagesChange]);

  const removeImage = useCallback(async (imageId: string) => {
    try {
      // Remove from storage
      const { error } = await supabase.storage
        .from('user-uploads')
        .remove([imageId]);

      if (error) throw error;

      const newImages = images.filter(img => img.id !== imageId);
      setImages(newImages);
      onImagesChange(newImages);
      
      toast.success('Image removed successfully');
    } catch (error) {
      console.error('Remove error:', error);
      toast.error('Failed to remove image');
    }
  }, [images, onImagesChange]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <Card 
        className={`relative transition-all duration-200 cursor-pointer hover:bg-accent/50 ${
          dragActive ? 'border-primary bg-primary/5' : 'border-dashed'
        } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <CardContent className="p-8 text-center">
          {isUploading ? (
            <div className="space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-sm text-muted-foreground">Uploading images...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-lg font-medium">Upload Images</p>
                <p className="text-sm text-muted-foreground">
                  Drag & drop images here, or click to select
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Max {maxImages} images, {maxSize}MB each • {allowedTypes.map(type => type.split('/')[1]).join(', ')}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={allowedTypes.join(',')}
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image) => (
            <Card key={image.id} className="relative group overflow-hidden">
              <CardContent className="p-0">
                <div className="aspect-square relative">
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(image.id);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-2">
                  <p className="text-xs font-medium truncate">{image.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(image.size)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary */}
      {images.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{images.length} of {maxImages} images uploaded</span>
          <Badge variant="secondary">
            <File className="h-3 w-3 mr-1" />
            Total: {formatFileSize(images.reduce((sum, img) => sum + img.size, 0))}
          </Badge>
        </div>
      )}
    </div>
  );
};