import os
import uuid
import aiofiles
from PIL import Image
from io import BytesIO
from fastapi import UploadFile, HTTPException
from ..config import get_settings

settings = get_settings()


class StorageService:
    """Service for handling file uploads (local filesystem for now)."""
    
    def __init__(self):
        self.upload_dir = settings.upload_dir
        self.max_size_mb = settings.max_photo_size_mb
        self._ensure_upload_dir()
    
    def _ensure_upload_dir(self):
        """Create upload directory if it doesn't exist."""
        os.makedirs(self.upload_dir, exist_ok=True)
        os.makedirs(os.path.join(self.upload_dir, "photos"), exist_ok=True)
        os.makedirs(os.path.join(self.upload_dir, "documents"), exist_ok=True)
    
    async def save_photo(self, file: UploadFile, project_id: int, issue_id: int) -> dict:
        """Save an uploaded photo with compression."""
        # Validate file type
        allowed_types = ["image/jpeg", "image/png", "image/webp", "image/heic"]
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type. Allowed: {', '.join(allowed_types)}"
            )
        
        # Read file content
        content = await file.read()
        
        # Check file size
        size_mb = len(content) / (1024 * 1024)
        if size_mb > self.max_size_mb:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Maximum size: {self.max_size_mb}MB"
            )
        
        # Generate unique filename
        ext = self._get_extension(file.filename or "photo.jpg")
        unique_id = uuid.uuid4().hex[:12]
        filename = f"{project_id}_{issue_id}_{unique_id}{ext}"
        
        # Compress and save
        try:
            img = Image.open(BytesIO(content))
            
            # Rotate based on EXIF if needed
            img = self._fix_orientation(img)
            
            # Resize if too large (max 2000px on longest side)
            max_dimension = 2000
            if max(img.size) > max_dimension:
                ratio = max_dimension / max(img.size)
                new_size = (int(img.size[0] * ratio), int(img.size[1] * ratio))
                img = img.resize(new_size, Image.Resampling.LANCZOS)
            
            # Convert to RGB if necessary (for JPEG)
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")
            
            # Save as JPEG with compression
            save_filename = filename.rsplit(".", 1)[0] + ".jpg"
            save_path = os.path.join(self.upload_dir, "photos", save_filename)
            
            img.save(save_path, "JPEG", quality=85, optimize=True)
            
            # Generate relative URL
            url = f"/uploads/photos/{save_filename}"
            
            return {
                "url": url,
                "filename": save_filename,
                "original_name": file.filename
            }
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to process image: {str(e)}")
    
    async def save_document(self, file: UploadFile, project_id: int) -> dict:
        """Save an uploaded document (PDF, etc.)."""
        allowed_types = ["application/pdf", "image/jpeg", "image/png"]
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type. Allowed: PDF, JPEG, PNG"
            )
        
        content = await file.read()
        
        # Generate unique filename
        ext = self._get_extension(file.filename or "document.pdf")
        unique_id = uuid.uuid4().hex[:12]
        filename = f"{project_id}_{unique_id}{ext}"
        
        save_path = os.path.join(self.upload_dir, "documents", filename)
        
        async with aiofiles.open(save_path, 'wb') as f:
            await f.write(content)
        
        url = f"/uploads/documents/{filename}"
        
        return {
            "url": url,
            "filename": filename,
            "original_name": file.filename
        }
    
    def delete_file(self, url: str):
        """Delete a file by its URL."""
        if url.startswith("/uploads/"):
            path = url.replace("/uploads/", "")
            full_path = os.path.join(self.upload_dir, path)
            if os.path.exists(full_path):
                os.remove(full_path)
    
    def _get_extension(self, filename: str) -> str:
        """Get file extension from filename."""
        if "." in filename:
            return "." + filename.rsplit(".", 1)[-1].lower()
        return ".jpg"
    
    def _fix_orientation(self, img: Image.Image) -> Image.Image:
        """Fix image orientation based on EXIF data."""
        try:
            from PIL import ExifTags
            
            for orientation in ExifTags.TAGS.keys():
                if ExifTags.TAGS[orientation] == 'Orientation':
                    break
            
            exif = img._getexif()
            if exif is not None:
                orientation_value = exif.get(orientation)
                if orientation_value == 3:
                    img = img.rotate(180, expand=True)
                elif orientation_value == 6:
                    img = img.rotate(270, expand=True)
                elif orientation_value == 8:
                    img = img.rotate(90, expand=True)
        except (AttributeError, KeyError, IndexError):
            pass
        return img


# Singleton instance
storage_service = StorageService()


def get_storage_service() -> StorageService:
    return storage_service
