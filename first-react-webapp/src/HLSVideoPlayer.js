import React, { useEffect } from 'react';
import Hls from 'hls.js';

function HLSVideoPlayer({ videoSrc,subSrc }) {
  useEffect(() => {
    const video = document.getElementById('my-video');
    
    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(videoSrc);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        //video.play();
        console.log("Video ready to play.");
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = videoSrc;
      video.addEventListener('loadedmetadata', () => {
        //video.play();
        console.log("Video ready to play.");
      });
    }
  }, [videoSrc]);

  return (
    <div>
      <video id="my-video" controls width="100%" >
        {
          (subSrc.includes(".vtt")) ? <track kind="subtitles" srclang="ko" label="Korean" src={subSrc} default /> :<></>
        }
      </video>
    </div>
  );
}

export default HLSVideoPlayer;