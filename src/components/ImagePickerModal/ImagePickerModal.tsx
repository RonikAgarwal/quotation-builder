import { ChangeEvent } from 'react';
import './ImagePickerModal.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  onImageSelected: (base64: string) => void;
}

export function ImagePickerModal({ isOpen, onClose, productName, onImageSelected }: Props) {
  if (!isOpen) return null;

  const handleDeviceUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          const MAX = 200;
          if (width > height) {
            if (width > MAX) {
              height *= MAX / width;
              width = MAX;
            }
          } else {
            if (height > MAX) {
              width *= MAX / height;
              height = MAX;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            onImageSelected(dataUrl);
            onClose();
          }
        };
        img.src = ev.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="ip-modal-overlay" onClick={onClose}>
      <div className="ip-modal" onClick={e => e.stopPropagation()}>
        <div className="ip-header">
          <h3>Add Image for {productName}</h3>
          <button className="ip-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="ip-body" style={{ minHeight: 'auto', paddingBottom: '30px' }}>
          <div className="ip-options">
            <div className="ip-option-btn">
              <span className="ip-option-icon">📁</span>
              <span className="ip-option-text">Browse Device</span>
              <input 
                type="file" 
                accept="image/jpeg, image/png, image/webp"
                onChange={handleDeviceUpload}
                className="ip-file-input-hidden"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
