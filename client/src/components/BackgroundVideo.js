import { useState } from "react";

export default function BackgroundVideo({ onVideoLoaded }) {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <video
        className="w-full h-full object-cover"
        autoPlay
        loop
        muted
        onCanPlayThrough={onVideoLoaded}
      >
        <source src="/AnyWave/videos/beach-bg.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

