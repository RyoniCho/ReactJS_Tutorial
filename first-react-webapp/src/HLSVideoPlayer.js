import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import axios from 'axios';
import Config from './Config';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';


function HLSVideoPlayer({ videoSrc, subSrc, movieId, episodeIndex = -1 }) {
  const videoRef = useRef(null);
  const [lastWatchedTime, setLastWatchedTime] = useState(0);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const navigate = useNavigate();
  const playbackStateRef = useRef({ movieId: null, episodeIndex: -1, src: null, time: 0 });
  
  // [AirPlay Sync] HLS 매니페스트에 자막이 포함되어 있는지 확인하는 상태
  // 기본값은 false로 설정하여, 불필요한 <track> 태그로 인한 충돌을 방지합니다.
  // 검사 결과 자막이 없다고 판단되면 true로 변경하여 <track>을 렌더링합니다.
  const [useHtmlTrack, setUseHtmlTrack] = useState(false);

  // HLS 매니페스트(m3u8)를 조회하여 내장 자막 여부 확인
  useEffect(() => {
    setUseHtmlTrack(false); // 소스 변경 시 초기화

    if (videoSrc && (videoSrc.includes('.m3u8') || videoSrc.includes('/api/stream'))) {
      axios.get(videoSrc)
        .then(response => {
          const content = response.data;
          if (typeof content === 'string' && content.includes('#EXT-X-MEDIA:TYPE=SUBTITLES')) {
            console.log("[HLS] Embedded subtitles detected. Skipping <track> tag.");
            setUseHtmlTrack(false);
          } else {
            console.log("[HLS] No embedded subtitles found. Enabling <track> tag fallback.");
            setUseHtmlTrack(true);
          }
        })
        .catch(err => {
          console.warn("[HLS] Failed to probe manifest, falling back to <track> tag:", err);
          setUseHtmlTrack(true);
        });
    } else {
      // HLS가 아닌 경우(예: mp4 직접 재생)에는 항상 track 태그 사용
      setUseHtmlTrack(true);
    }
  }, [videoSrc]);

  // 토큰 만료 체크 함수
  const isTokenExpired = (token) => {
    if (!token) return true;
    try {
      const { exp } = jwtDecode(token);
      return !exp || Date.now() >= exp * 1000;
    } catch {
      return true;
    }
  };

  // HLS.js 초기화
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls;
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    // 화질 변경 시 재생 위치 유지를 위한 로직
    let startTime = 0;

    // 같은 영화, 같은 에피소드이면서 소스(화질)만 변경된 경우에만 재생 위치 복원
    if (playbackStateRef.current.movieId === movieId && 
        playbackStateRef.current.episodeIndex === episodeIndex &&
        playbackStateRef.current.src !== videoSrc) {
        startTime = playbackStateRef.current.time;
    }

    const onLoadedMetadata = () => {
        console.log("Video ready to play (Safari native HLS).");
        if (startTime > 0) {
            video.currentTime = startTime;
        }
    };

    if (isSafari && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = videoSrc;
      video.addEventListener('loadedmetadata', onLoadedMetadata, { once: true });
    } else if (Hls.isSupported()) {
      // startPosition을 명시적으로 설정하여 EVENT 타입 플레이리스트에서도 처음부터 재생되도록 강제
      hls = new Hls({
        startPosition: startTime
      });
      hls.loadSource(videoSrc);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log("Video ready to play (HLS.js).");
      });
    }

    return () => {
        // 현재 상태 저장 (다음 렌더링 시 비교용)
        playbackStateRef.current = {
            movieId: movieId,
            episodeIndex: episodeIndex,
            src: videoSrc,
            time: video.currentTime
        };

        if (hls) {
            hls.destroy();
        }
        if (isSafari) {
             video.removeEventListener('loadedmetadata', onLoadedMetadata);
        }
        // 소스 변경 시 비디오 태그 초기화 (잔여 버퍼 제거)
        video.removeAttribute('src');
        video.load();
    };
  }, [videoSrc, movieId, episodeIndex]);

  // 시청 기록 조회
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token || !movieId) return;
    const fetchWatchHistory = async () => {
      try {
        const res = await axios.get(
          `${Config.apiUrl}/api/watch-history?movieId=${movieId}&episodeIndex=${episodeIndex}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.lastWatchedTime > 0) {
          setLastWatchedTime(res.data.lastWatchedTime);
          setShowResumePrompt(true);
        }
      } catch (err) {}
    };
    fetchWatchHistory();
  }, [movieId, episodeIndex]);

  // 일정 간격마다 재생 위치 저장
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token || !movieId) return;
    const interval = setInterval(() => {
      const video = videoRef.current;
      if (video && !video.paused) {
        axios.post(
          `${Config.apiUrl}/api/watch-history`,
          { movieId, lastWatchedTime: Math.floor(video.currentTime), episodeIndex },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    }, 10000); // 10초마다 저장
    return () => clearInterval(interval);
  }, [movieId, episodeIndex]);

  // 초를 hh:mm:ss로 변환하는 함수
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h, m, s]
      .map(v => v < 10 ? `0${v}` : `${v}`)
      .join(':');
  };

  // 이어보기 팝업 & 토큰 만료 체크: play 이벤트 발생 시에만
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onPlay = () => {
      const token = localStorage.getItem('accessToken');
      if (isTokenExpired(token)) {
        alert('로그인이 만료되었습니다. 다시 로그인 해주세요.');
        localStorage.removeItem('accessToken');
        navigate('/login');
        return;
      }
      if (showResumePrompt) {
        if (window.confirm(`저장된 시청 기록이 있습니다. ${formatTime(lastWatchedTime)}부터 이어서 재생할까요?`)) {
          video.currentTime = lastWatchedTime;
        }
        setShowResumePrompt(false);
      }
    };
    video.addEventListener('play', onPlay);
    return () => {
      video.removeEventListener('play', onPlay);
    };
  }, [showResumePrompt, lastWatchedTime, navigate]);

  return (
    <div>
      <video ref={videoRef} id="my-video" controls width="100%" playsInline>
        {
          (useHtmlTrack && subSrc && subSrc.includes(".vtt")) ? <track kind="subtitles" srclang="ko" label="Korean" src={subSrc} default /> : <></>
        }
      </video>
    </div>
  );
}

export default HLSVideoPlayer;