import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import axios from 'axios';
import Config from './Config';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';


function HLSVideoPlayer({ videoSrc, subSrc, movieId, episodeIndex = -1, useLocalSubtitles = true }) {
  const videoRef = useRef(null);
  const [lastWatchedTime, setLastWatchedTime] = useState(0);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [isAirPlayActive, setIsAirPlayActive] = useState(false);
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
        const isWireless = video.webkitCurrentPlaybackTargetIsWireless;
        setIsAirPlayActive(isWireless);
        
        if (isWireless) {
            console.log("[AirPlay] Wireless playback active. Subtitles will be handled by Apple TV (HLS Manifest).");
        } else {
            console.log("[AirPlay] Local playback active. Using <track> tag for better seeking performance.");
        }
    };

    // 초기 상태 확인
    if (video.webkitCurrentPlaybackTargetIsWireless !== undefined) {
        setIsAirPlayActive(video.webkitCurrentPlaybackTargetIsWireless);
    }

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

    // 자막 트랙 설정 함수 (공통)
    const configureTextTracks = () => {
        const textTracks = video.textTracks;
        if (!textTracks) return;

        console.log(`[VideoPlayer] Configuring text tracks. Total tracks: ${textTracks.length}`);

        for (let i = 0; i < textTracks.length; i++) {
            const track = textTracks[i];
            if (track.kind === 'subtitles') {
                // [Label Check] 로컬 트랙 식별
                if (track.label && track.label.includes('(Local)')) {
                    // 로컬 트랙은 유지 (기본값인 한국어만 활성화)
                    if (track.label === 'Korean (Local)') {
                        track.mode = 'showing';
                        console.log(`[VideoPlayer] Enabled local <track>: ${track.label}`);
                    }
                } else {
                    // HLS 내장 자막 등 비활성화 (중복 방지)
                    track.mode = 'disabled';
                    console.log(`[VideoPlayer] Disabled subtitle track: ${track.label}`);
                }
            }
        }
    };

    const onLoadedMetadata = () => {
        console.log("Video metadata loaded.");
        // Safari는 startPosition 옵션이 없으므로 수동으로 이동
        if (isSafari && startTime > 0) {
            video.currentTime = startTime;
        }
        configureTextTracks();
    };

    // 모든 브라우저에서 메타데이터 로드 시 자막 설정 실행
    video.addEventListener('loadedmetadata', onLoadedMetadata);

    if (isSafari && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = videoSrc;
      // loadedmetadata 리스너는 위에서 이미 등록됨
    } else if (Hls.isSupported()) {
      // startPosition을 명시적으로 설정하여 EVENT 타입 플레이리스트에서도 처음부터 재생되도록 강제
      hls = new Hls({
        startPosition: startTime
      });
      hls.loadSource(videoSrc);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log("Video ready to play (HLS.js).");
        // HLS.js 로드 완료 후에도 자막 설정 한 번 더 확인
        configureTextTracks();
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
        
        video.removeEventListener('loadedmetadata', onLoadedMetadata);
        
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

  const renderSubtitles = () => {
    // 사용자가 수동으로 로컬 자막을 껐거나, AirPlay가 활성화된 경우(자동 감지) 렌더링 안 함
    // 단, AirPlay 감지가 늦을 수 있으므로 수동 토글을 제공함
    if (!useLocalSubtitles) return null;

    if (!subSrc || !subSrc.includes(".vtt")) return null;
    
    // 다국어 자막 지원을 위한 트랙 목록
    // 파일이 실제로 존재하는지 확인하지 않고, 규칙에 따라 URL을 생성하여 태그를 추가합니다.
    // 브라우저는 존재하지 않는 파일에 대해 404를 무시하거나 빈 트랙으로 처리합니다.
    const languages = [
        { code: 'ko', label: 'Korean (Local)', suffix: '' }, // 기본값 (파일명.vtt)
        { code: 'en', label: 'English (Local)', suffix: '.en' }, // 파일명.en.vtt
        { code: 'ja', label: 'Japanese (Local)', suffix: '.ja' }, // 파일명.ja.vtt
        { code: 'zh', label: 'Chinese (Local)', suffix: '.zh' }, // 파일명.zh.vtt
    ];

    return languages.map((lang, index) => (
        <track 
            key={`${lang.code}-${subSrc}`} 
            id={`local-sub-${lang.code}`}
            kind="subtitles" 
            srclang={lang.code} 
            label={lang.label} 
            src={subSrc.replace('.vtt', `${lang.suffix}.vtt`)} 
            default={index === 0} 
            onError={(e) => console.error(`[VideoPlayer] Track error for ${lang.label}:`, e)}
        />
    ));
  };

  return (
    <div>
      <video ref={videoRef} id="my-video" controls width="100%" playsInline crossOrigin="anonymous">
        {renderSubtitles()}
      </video>
    </div>
  );
}

export default HLSVideoPlayer;