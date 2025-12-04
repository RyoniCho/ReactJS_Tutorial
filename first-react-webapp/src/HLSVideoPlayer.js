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

  // [Hybrid Subtitle Strategy]
  // 1. 로컬 브라우저: <track> 태그 사용 (탐색 시 끊김 없음, 안정적)
  // 2. AirPlay: HLS 매니페스트 내장 자막 사용 (AirPlay는 <track>을 무시하고 매니페스트를 직접 로드함)
  // 따라서 두 가지를 모두 제공하면, 각 환경에 맞는 최적의 자막이 자동으로 선택됩니다.
  
  // AirPlay 상태 감지 및 로깅
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleAirPlayChange = (e) => {
        if (video.webkitCurrentPlaybackTargetIsWireless) {
            console.log("[AirPlay] Wireless playback active. Subtitles will be handled by Apple TV (HLS Manifest).");
        } else {
            console.log("[AirPlay] Local playback active. Using <track> tag for better seeking performance.");
        }
    };

    // Safari 전용 이벤트 리스너
    if (window.WebKitPlaybackTargetAvailabilityEvent) {
        video.addEventListener('webkitcurrentplaybacktargetiswirelesschanged', handleAirPlayChange);
    }

    return () => {
        if (window.WebKitPlaybackTargetAvailabilityEvent) {
            video.removeEventListener('webkitcurrentplaybacktargetiswirelesschanged', handleAirPlayChange);
        }
    };
  }, []);

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

        // [Local Safari Fix] HLS 내장 자막(탐색 시 끊김)을 비활성화하고, <track> 자막(안정적)을 강제 선택
        const textTracks = video.textTracks;
        if (textTracks) {
            for (let i = 0; i < textTracks.length; i++) {
                const track = textTracks[i];
                // <track id="local-sub"> 태그와 연결된 트랙인지 확인
                // (Safari에서는 track 요소의 id가 TextTrack 객체에 반영되지 않을 수 있으므로, 라벨이나 기타 속성으로 보완 확인 가능하지만,
                //  가장 확실한 건 우리가 넣은 track을 제외한 나머지를 끄는 것)
                
                // 여기서는 <track> 태그에 id="local-sub"를 주었으므로, 이를 식별 시도.
                // 만약 id가 전달되지 않는다면, mode='showing'인 것을 찾거나 해야 함.
                
                // 전략: 모든 자막 트랙을 일단 disabled로 만들고, 우리가 원하는 것만 showing으로 변경?
                // 하지만 DOM의 <track> 요소가 로드되는 시점과 HLS 파싱 시점이 다를 수 있음.
                
                // 더 안전한 방법: 
                // HLS 자막은 보통 in-band로 들어오며 DOM 요소가 없음.
                // <track> 태그는 DOM 요소가 있음.
                
                // 여기서는 간단히 'label'이 같을 수 있으므로, 
                // 우리가 넣은 <track>을 찾아서 켜주는 로직을 수행.
                
                // 만약 track.id가 지원된다면 베스트. 지원 안된다면 label로 구분하되,
                // HLS 자막도 "Korean"일 수 있음.
                
                // 따라서, 아래 <track> 태그에 id="local-sub"를 추가하고,
                // 여기서 track.id === "local-sub" 인 것을 찾아서 mode = "showing"
                // 나머지는 mode = "disabled"
                
                if (track.kind === 'subtitles') {
                    if (track.id === 'local-sub') {
                        track.mode = 'showing';
                        console.log("[Local Safari] Enabled local <track> subtitle.");
                    } else {
                        // HLS 내장 자막 등
                        track.mode = 'disabled';
                        console.log("[Local Safari] Disabled HLS embedded subtitle to prevent seeking issues.");
                    }
                }
            }
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
          (subSrc && subSrc.includes(".vtt")) ? <track id="local-sub" kind="subtitles" srclang="ko" label="Korean" src={subSrc} default /> : <></>
        }
      </video>
    </div>
  );
}

export default HLSVideoPlayer;