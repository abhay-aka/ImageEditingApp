import React, { useState, useRef } from 'react';
import { Upload, RotateCw, FlipHorizontal, FlipVertical, X, Plus, Search, Tag, Crop } from 'lucide-react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';


function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
    return centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        aspect,
        mediaWidth,
        mediaHeight
      ),
      mediaWidth,
      mediaHeight
    );
}

const ImageAssetManager = () => {
    const [images, setImages] = useState([]);
    const [selectedImage, setSelectedImage] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    // const [isCroppingActive, setIsCroppingActive] = useState(false); // New state for cropping
    const [searchQuery, setSearchQuery] = useState('');
    const [imageTransforms, setImageTransforms] = useState({});
    const [imageMetadata, setImageMetadata] = useState({});
    const [crop, setCrop] = useState();
    const [completedCrop, setCompletedCrop] = useState();
    const imgRef = useRef(null);
    // const canvasRef = useRef(null);
  
    const predefinedTags = ['fashion', 'sports', 'nature', 'technology', 'food', 'travel', 'art', 'music'];
  
    function onImageLoad(e) {
      if (aspect) {
        const { width, height } = e.currentTarget;
        setCrop(centerAspectCrop(width, height, aspect));
      }
    }
  
    function getCroppedImg(image, crop) {
      const canvas = document.createElement('canvas');
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      canvas.width = crop.width;
      canvas.height = crop.height;
      const ctx = canvas.getContext('2d');
  
      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width,
        crop.height
      );
  
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          resolve(URL.createObjectURL(blob));
        }, 'image/jpeg');
      });
    }
  
    const handleFileUpload = (e) => {
      const file = e.target.files[0];
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const newImage = {
            id: Date.now(),
            url: event.target.result,
            name: file.name,
          };
          setSelectedImage(newImage);
          setImageMetadata((prev) => ({
            ...prev,
            [newImage.id]: {
              description: '',
              tags: [],
              title: file.name,
            },
          }));
          setImageTransforms((prev) => ({
            ...prev,
            [newImage.id]: {
              rotate: 0,
              flipH: false,
              flipV: false,
            },
          }));
          setIsEditMode(true);
          setCrop(undefined); // Reset crop when new image is loaded
        };
        reader.readAsDataURL(file);
      }
    };
  
    const handleSave = async () => {
      if (selectedImage && completedCrop?.width && completedCrop?.height) {
        try {
          const croppedImageUrl = await getCroppedImg(imgRef.current, completedCrop);
          const updatedImage = {
            ...selectedImage,
            url: croppedImageUrl,
          };
          setImages((prev) => [...prev, updatedImage]);
          setIsEditMode(false);
          setSelectedImage(null);
        } catch (e) {
          console.error('Error applying crop:', e);
        }
      }
    };
  const filteredImages = images.filter(image => {
    const metadata = imageMetadata[image.id];
    const searchLower = searchQuery.toLowerCase();
    return (
      metadata?.title?.toLowerCase().includes(searchLower) ||
      metadata?.description?.toLowerCase().includes(searchLower) ||
      metadata?.tags?.some(tag => tag.toLowerCase().includes(searchLower))
    );
  });

  // Empty State Component
  if (images.length === 0 && !isEditMode) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
        <div className="w-48 h-48 mb-6">
          <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-gray-300">
            <path
              d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M3 15l5.172-5.172a2 2 0 012.828 0L15 13.828M14 3h7v7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M21 3l-7 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <label className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
          <Plus className="w-5 h-5 mr-2" />
          Add Image
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileUpload}
          />
        </label>
      </div>
    );
  }

  // Edit Mode
  if (isEditMode && selectedImage) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-semibold">Edit Image</h2>
            <button
              onClick={() => {
                setIsEditMode(false);
                setSelectedImage(null);
              }}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
  
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <div className="relative rounded-lg overflow-hidden bg-gray-50">
                {crop && (
                  <ReactCrop
                    crop={crop}
                    onChange={(c) => setCrop(c)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={undefined}
                  >
                    <img
                      ref={imgRef}
                      src={selectedImage.url}
                      alt={selectedImage.name}
                      className="max-h-[600px] w-auto mx-auto"
                      style={{
                        transform: `
                          rotate(${imageTransforms[selectedImage.id]?.rotate || 0}deg)
                          scaleX(${imageTransforms[selectedImage.id]?.flipH ? -1 : 1})
                          scaleY(${imageTransforms[selectedImage.id]?.flipV ? -1 : 1})
                        `
                      }}
                      onLoad={onImageLoad}
                    />
                  </ReactCrop>
                )}
                {!crop && (
                  <img
                    ref={imgRef}
                    src={selectedImage.url}
                    alt={selectedImage.name}
                    className="max-h-[600px] w-auto mx-auto"
                    style={{
                      transform: `
                        rotate(${imageTransforms[selectedImage.id]?.rotate || 0}deg)
                        scaleX(${imageTransforms[selectedImage.id]?.flipH ? -1 : 1})
                        scaleY(${imageTransforms[selectedImage.id]?.flipV ? -1 : 1})
                      `
                    }}
                  />
                )}
              </div>
  
              <div className="mt-8 flex justify-center gap-6">
                <button
                  onClick={() => {
                    const newRotation = (imageTransforms[selectedImage.id]?.rotate || 0) + 90;
                    setImageTransforms((prev) => ({
                      ...prev,
                      [selectedImage.id]: {
                        ...prev[selectedImage.id],
                        rotate: newRotation,
                      },
                    }));
                  }}
                  className="p-3 hover:bg-gray-100 rounded-full"
                >
                  <RotateCw className="w-6 h-6" />
                </button>
                <button
                  onClick={() => {
                    setImageTransforms((prev) => ({
                      ...prev,
                      [selectedImage.id]: {
                        ...prev[selectedImage.id],
                        flipH: !prev[selectedImage.id]?.flipH,
                      },
                    }));
                  }}
                  className="p-3 hover:bg-gray-100 rounded-full"
                >
                  <FlipHorizontal className="w-6 h-6" />
                </button>
                <button
                  onClick={() => {
                    setImageTransforms((prev) => ({
                      ...prev,
                      [selectedImage.id]: {
                        ...prev[selectedImage.id],
                        flipV: !prev[selectedImage.id]?.flipV,
                      },
                    }));
                  }}
                  className="p-3 hover:bg-gray-100 rounded-full"
                >
                  <FlipVertical className="w-6 h-6" />
                </button>
                <button
                    onClick={() => setCrop({ unit: '%', width: 50, height: 50, x: 25, y: 25 })}
                    className="p-3 hover:bg-gray-100 rounded-full">
                    <Crop className="w-5 h-5" />
                </button>
              </div>
            </div>
  
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg"
                  value={imageMetadata[selectedImage.id]?.title || ''}
                  onChange={(e) => {
                    setImageMetadata((prev) => ({
                      ...prev,
                      [selectedImage.id]: {
                        ...prev[selectedImage.id],
                        title: e.target.value,
                      },
                    }));
                  }}
                />
              </div>
  
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  className="w-full px-4 py-2 border rounded-lg"
                  rows="4"
                  value={imageMetadata[selectedImage.id]?.description || ''}
                  onChange={(e) => {
                    setImageMetadata((prev) => ({
                      ...prev,
                      [selectedImage.id]: {
                        ...prev[selectedImage.id],
                        description: e.target.value,
                      },
                    }));
                  }}
                />
              </div>
  
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {predefinedTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => {
                        setImageMetadata((prev) => {
                          const currentTags = prev[selectedImage.id]?.tags || [];
                          const newTags = currentTags.includes(tag)
                            ? currentTags.filter((t) => t !== tag)
                            : [...currentTags, tag];
                          return {
                            ...prev,
                            [selectedImage.id]: {
                              ...prev[selectedImage.id],
                              tags: newTags,
                            },
                          };
                        });
                      }}
                      className={`px-3 py-1 rounded-full text-sm ${
                        imageMetadata[selectedImage.id]?.tags?.includes(tag)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
  
              <button
                onClick={handleSave}
                className="mt-8 w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
              >
                Save Image
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  

  // Gallery View
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search images..."
              className="pl-10 pr-4 py-2 border rounded-lg w-72"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
          </div>
          
          <label className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
            <Plus className="w-5 h-5 mr-2" />
            Add Image
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileUpload}
            />
          </label>
        </div>

        <div className="columns-2 md:columns-3 lg:columns-4 gap-6">
          {filteredImages.map(image => (
            <div key={image.id} className="break-inside-avoid mb-6">
              <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="relative" style={{ paddingBottom: '75%' }}>
                  <img
                    src={image.url}
                    alt={imageMetadata[image.id]?.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{
                      transform: `
                        rotate(${imageTransforms[image.id]?.rotate || 0}deg)
                        scaleX(${imageTransforms[image.id]?.flipH ? -1 : 1})
                        scaleY(${imageTransforms[image.id]?.flipV ? -1 : 1})
                      `,
                      width: `${imageTransforms[image.id]?.crop?.width || 100}%`,
                      height: `${imageTransforms[image.id]?.crop?.height || 100}%`,
                      left: `${imageTransforms[image.id]?.crop?.left || 0}%`,
                      top: `${imageTransforms[image.id]?.crop?.top || 0}%`,
                    }}
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold mb-1">{imageMetadata[image.id]?.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{imageMetadata[image.id]?.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {imageMetadata[image.id]?.tags?.map(tag => (
                      <span key={tag} className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ImageAssetManager;
