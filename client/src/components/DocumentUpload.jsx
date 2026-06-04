import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import CameraCapture from './CameraCapture';

function isMobileDevice() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export default function DocumentUpload({ label, file, onChange, useFrontCamera = false }) {
  const fileRef = useRef(null);
  const nativeCameraRef = useRef(null);
  const [cameraOpen, setCameraOpen] = useState(false);

  const handleFile = (selected) => {
    onChange(selected);
  };

  const openCamera = () => {
    if (navigator.mediaDevices?.getUserMedia) {
      setCameraOpen(true);
      return;
    }

    if (isMobileDevice()) {
      nativeCameraRef.current?.click();
      return;
    }

    toast.error('Camera not available — use Upload or try on your phone.');
  };

  return (
    <div className="doc-upload">
      {label && <span className="doc-label">{label}</span>}
      <div className="doc-buttons">
        <button type="button" className="btn-secondary" onClick={openCamera}>
          📷 Camera
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => fileRef.current?.click()}
        >
          📁 Upload
        </button>
      </div>

      <input
        ref={nativeCameraRef}
        type="file"
        accept="image/*"
        capture={useFrontCamera ? 'user' : 'environment'}
        hidden
        onChange={(e) => {
          handleFile(e.target.files?.[0] || null);
          e.target.value = '';
        }}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        hidden
        onChange={(e) => {
          handleFile(e.target.files?.[0] || null);
          e.target.value = '';
        }}
      />

      <CameraCapture
        open={cameraOpen}
        facingMode={useFrontCamera ? 'user' : 'environment'}
        onClose={() => setCameraOpen(false)}
        onCapture={(captured) => handleFile(captured)}
      />

      {file && <p className="file-name">✓ {file.name}</p>}
    </div>
  );
}
