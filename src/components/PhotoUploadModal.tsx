import React, { useState } from 'react';
import { X, Upload, Check, Image as ImageIcon, Sparkles } from 'lucide-react';

interface PhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPhoto: (url: string) => void;
  currentPhotoUrl?: string;
}

const PRESET_PHOTOS = [
  {
    title: 'Central Philippine University Campus Aerial',
    category: 'CPU Campus',
    url: '/cpu_campus_aerial_1785881684967.jpg',
  },
  {
    title: 'Broken Wall Electric Fan',
    category: 'HVAC',
    url: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=600&auto=format&fit=crop&q=80',
  },
  {
    title: 'Water Leak / Wet Floor',
    category: 'Plumbing',
    url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=80',
  },
  {
    title: 'Flickering Fluorescent Light',
    category: 'Electrical',
    url: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=600&auto=format&fit=crop&q=80',
  },
  {
    title: 'Damaged Student Desk',
    category: 'Furniture',
    url: 'https://images.unsplash.com/photo-1503602642458-232111445657?w=600&auto=format&fit=crop&q=80',
  },
  {
    title: 'Projector & IT Issue',
    category: 'IT & AV',
    url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80',
  },
  {
    title: 'Door Handle / Lock Damage',
    category: 'Structure',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80',
  },
  {
    title: 'Clogged Bathroom Sink',
    category: 'Sanitation',
    url: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&auto=format&fit=crop&q=80',
  },
  {
    title: 'Broken Air Conditioner',
    category: 'HVAC',
    url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80',
  },
];

export const PhotoUploadModal: React.FC<PhotoUploadModalProps> = ({
  isOpen,
  onClose,
  onSelectPhoto,
  currentPhotoUrl = '',
}) => {
  const [selectedUrl, setSelectedUrl] = useState<string>(currentPhotoUrl);
  const [customFilePreview, setCustomFilePreview] = useState<string>('');

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setCustomFilePreview(base64);
        setSelectedUrl(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirm = () => {
    if (selectedUrl) {
      onSelectPhoto(selectedUrl);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-blue-200 overflow-hidden animate-fadeIn my-8">
        {/* Modal Header */}
        <div className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between border-b-2 border-amber-400">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-lg">Attach Facility Photo Evidence</h3>
          </div>
          <button
            onClick={onClose}
            className="text-blue-200 hover:text-white p-1 rounded-lg hover:bg-blue-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Custom File Drag & Drop Upload */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Upload Custom Photo from Device
            </label>
            <div className="border-2 border-dashed border-blue-300 hover:border-amber-400 rounded-xl p-4 text-center bg-blue-50/50 hover:bg-blue-50 transition-colors cursor-pointer relative group">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="flex flex-col items-center justify-center space-y-1">
                <Upload className="w-8 h-8 text-blue-800 group-hover:scale-110 transition-transform" />
                <p className="text-xs font-bold text-blue-950">
                  Click or drag photo file here
                </p>
                <p className="text-[11px] text-slate-500">
                  PNG, JPG, or WEBP (Max 5MB)
                </p>
              </div>
            </div>
          </div>

          {/* Preset Campus Facility Photo Samples */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Or Select Sample Campus Facility Issue
              </label>
              <span className="text-[11px] text-blue-800 font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Common SHS Issues
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-60 overflow-y-auto p-1">
              {PRESET_PHOTOS.map((item, idx) => {
                const isSelected = selectedUrl === item.url;
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedUrl(item.url);
                      setCustomFilePreview('');
                    }}
                    className={`relative rounded-lg overflow-hidden border-2 cursor-pointer transition-all group ${
                      isSelected
                        ? 'border-amber-400 ring-2 ring-amber-400/50 scale-[1.02]'
                        : 'border-slate-200 hover:border-blue-400'
                    }`}
                  >
                    <img
                      src={item.url}
                      alt={item.title}
                      className="w-full h-24 object-cover group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/cpu_campus_aerial_1785881684967.jpg';
                      }}
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-blue-950/90 via-blue-950/60 to-transparent p-1.5 text-white">
                      <p className="text-[10px] font-bold truncate">{item.title}</p>
                      <span className="text-[9px] text-amber-300">{item.category}</span>
                    </div>
                    {isSelected && (
                      <div className="absolute top-1 right-1 bg-amber-400 text-blue-950 rounded-full p-0.5">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Preview Selected */}
          {selectedUrl && (
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center gap-3">
              <img
                src={selectedUrl}
                alt="Selected preview"
                className="w-16 h-16 object-cover rounded-lg border border-slate-300"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/cpu_campus_aerial_1785881684967.jpg';
                }}
              />
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-800">Selected Attachment</p>
                <p className="text-[11px] text-slate-500 truncate max-w-xs">
                  {selectedUrl.startsWith('data:') ? 'Custom File Uploaded' : selectedUrl}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedUrl('');
                  setCustomFilePreview('');
                }}
                className="text-xs text-red-600 hover:underline font-semibold"
              >
                Remove
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 px-6 py-3 flex items-center justify-end gap-3 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedUrl}
            className="px-5 py-2 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-blue-950 font-extrabold text-xs rounded-xl shadow transition-colors flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            Attach Selected Photo
          </button>
        </div>
      </div>
    </div>
  );
};
