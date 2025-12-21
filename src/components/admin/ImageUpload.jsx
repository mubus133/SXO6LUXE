import React, { useState } from 'react'
import { supabase } from '@/config/supabase'
import toast from 'react-hot-toast'
import './ImageUpload.css'

const ImageUpload = ({ images, setImages, bucketName = 'product-images' }) => {
  const [uploading, setUploading] = useState(false)
  const [uploadMethod, setUploadMethod] = useState('file') // 'file' or 'url'

  const handleFileUpload = async (e, index) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB')
      return
    }

    setUploading(true)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file)

      if (error) throw error

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath)

      // Update images array
      const newImages = [...images]
      newImages[index] = publicUrl
      setImages(newImages)

      toast.success('Image uploaded successfully')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  const handleUrlChange = (index, url) => {
    const newImages = [...images]
    newImages[index] = url
    setImages(newImages)
  }

  const addImageSlot = () => {
    setImages([...images, ''])
  }

  const removeImageSlot = (index) => {
    setImages(images.filter((_, i) => i !== index))
  }

  return (
    <div className="image-upload-container">
      {images.map((image, index) => (
        <div key={index} className="image-upload-item">
          <label className="admin-form-label">
            Image {index + 1} {index === 0 && '(Primary)'}
          </label>

          {/* Upload Method Toggle */}
          <div className="upload-method-toggle">
            <button
              type="button"
              className={`method-btn ${uploadMethod === 'file' ? 'active' : ''}`}
              onClick={() => setUploadMethod('file')}
            >
              <i className="bi bi-cloud-upload me-2"></i>
              Upload File
            </button>
            <button
              type="button"
              className={`method-btn ${uploadMethod === 'url' ? 'active' : ''}`}
              onClick={() => setUploadMethod('url')}
            >
              <i className="bi bi-link-45deg me-2"></i>
              Enter URL
            </button>
          </div>

          {/* File Upload */}
          {uploadMethod === 'file' ? (
            <div className="file-upload-area">
              {image ? (
                <div className="uploaded-image-preview">
                  <img src={image} alt={`Product ${index + 1}`} />
                  <button
                    type="button"
                    className="remove-image-btn"
                    onClick={() => handleUrlChange(index, '')}
                  >
                    <i className="bi bi-x-circle"></i>
                  </button>
                </div>
              ) : (
                <label className="file-upload-label">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, index)}
                    disabled={uploading}
                    className="file-input-hidden"
                  />
                  <div className="file-upload-content">
                    {uploading ? (
                      <>
                        <div className="spinner-border spinner-border-sm"></div>
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <i className="bi bi-cloud-upload"></i>
                        <span>Click to upload or drag and drop</span>
                        <small>PNG, JPG, GIF up to 5MB</small>
                      </>
                    )}
                  </div>
                </label>
              )}
            </div>
          ) : (
            /* URL Input */
            <div className="url-input-area">
              <input
                type="url"
                className="admin-form-control"
                value={image}
                onChange={(e) => handleUrlChange(index, e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
              {image && (
                <div className="url-image-preview">
                  <img src={image} alt={`Product ${index + 1}`} />
                </div>
              )}
            </div>
          )}

          {/* Remove Button */}
          {images.length > 1 && (
            <button
              type="button"
              className="btn btn-danger btn-sm mt-2"
              onClick={() => removeImageSlot(index)}
            >
              <i className="bi bi-trash me-1"></i>
              Remove Image
            </button>
          )}
        </div>
      ))}

      {/* Add More Images */}
      <button
        type="button"
        className="btn btn-outline btn-sm"
        onClick={addImageSlot}
      >
        <i className="bi bi-plus-lg me-2"></i>
        Add Another Image
      </button>
    </div>
  )
}

export default ImageUpload