import React, { useEffect } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

function HLSVideoPlayer({ videoSrc }) {
    useEffect(() => {
      const player = videojs(document.getElementById('my-video'), {
        controls: true,
        autoplay: false,
        preload: 'auto',
      });
  
      return () => {
        player.dispose();
      };
    }, [videoSrc]);
  
    return (
      <div>
        <video id="my-video" className="video-js vjs-default-skin" controls>
          <source src={videoSrc} type="application/x-mpegURL" />
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }
  
  export default HLSVideoPlayer;
