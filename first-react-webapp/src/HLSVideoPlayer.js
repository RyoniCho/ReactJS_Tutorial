
import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import axios from 'axios';
import Config from './Config';


function HLSVideoPlayer({ videoSrc, subSrc, movieId }) {
  const videoRef = useRef(null);
  const [lastWatchedTime, setLastWatchedTime] = useState(0);
  const [showResumePrompt, setShowResumePrompt] = useState(false);

  // HLS.js 초기화
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(videoSrc);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log("Video ready to play.");
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = videoSrc;
      video.addEventListener('loadedmetadata', () => {
        console.log("Video ready to play.");
      });
    }
  }, [videoSrc]);

  // 시청 기록 조회
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !movieId) return;
    const fetchWatchHistory = async () => {
      try {
        const res = await axios.get(
          `${Config.apiUrl}/api/watch-history?movieId=${movieId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.lastWatchedTime > 0) {
          setLastWatchedTime(res.data.lastWatchedTime);
          setShowResumePrompt(true);
        }
      } catch (err) {}
    };
    fetchWatchHistory();
  }, [movieId]);

  // 일정 간격마다 재생 위치 저장
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !movieId) return;
    const interval = setInterval(() => {
      const video = videoRef.current;
      if (video && !video.paused) {
        axios.post(
          `${Config.apiUrl}/api/watch-history`,
          { movieId, lastWatchedTime: Math.floor(video.currentTime) },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    }, 10000); // 10초마다 저장
    return () => clearInterval(interval);
  }, [movieId]);

  // 이어보기 팝업 처리
  useEffect(() => {
    if (showResumePrompt && videoRef.current) {
      if (window.confirm(`저장된 시청 기록이 있습니다. ${lastWatchedTime}초부터 이어서 재생할까요?`)) {
        videoRef.current.currentTime = lastWatchedTime;
      }
      setShowResumePrompt(false);
    }
  }, [showResumePrompt, lastWatchedTime]);

  return (
    <div>
      <video ref={videoRef} id="my-video" controls width="100%">
        {
          (subSrc && subSrc.includes(".vtt")) ? <track kind="subtitles" srclang="ko" label="Korean" src={subSrc} default /> : <></>
        }
      </video>
    </div>
  );
}

export default HLSVideoPlayer;