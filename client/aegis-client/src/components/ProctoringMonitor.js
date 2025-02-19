import React, { useRef, useEffect } from "react";

function ProctoringMonitor() {
  const videoRef = useRef(null);

  useEffect(() => {
    startVideo();
  }, []);

  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(err => console.error("Error accessing camera:", err));
  };

  // Here you could integrate face-api.js to detect multiple faces, etc.

  return (
    <div>
      <h3>Proctoring Monitor</h3>
      <video
        ref={videoRef}
        width="400"
        height="300"
        autoPlay
        muted
      />
    </div>
  );
}

export default ProctoringMonitor;