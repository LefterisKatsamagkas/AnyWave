export default function BackgroundVideo() {
  return (
    <div className="relative w-full h-screen overflow-hidden">
      <video
        className="w-full h-full object-cover"
        autoPlay
        loop
        muted
      >
        <source src="/AnyWave/videos/beach-bg.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

