import React, { useEffect } from 'react';
import Hls from 'hls.js';

function HLSVideoPlayer({ videoSrc }) {
  useEffect(() => {
    const video = document.getElementById('my-video');
    
    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(videoSrc);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play();
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = videoSrc;
      video.addEventListener('loadedmetadata', () => {
        video.play();
      });
    }
  }, [videoSrc]);

  return (
    <div>
      <video id="my-video" controls width="100%" />
    </div>
  );
}

export default HLSVideoPlayer;