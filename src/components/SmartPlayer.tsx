import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import * as dashjs from 'dashjs';
import { Stream } from '../types';

interface SmartPlayerProps {
  key?: string | number;
  stream: Stream | null;
  isLive?: boolean;
}

const API_BASE = import.meta.env.VITE_API_BASE || '';

export default function SmartPlayer({ stream, isLive = false }: SmartPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [resolvedStream, setResolvedStream] = useState<Stream | null>(null);

  useEffect(() => {
    if (!stream) {
      setResolvedStream(null);
      return;
    }

    let effectiveType = stream.type;
    const isSocialStream = stream.url.includes('youtube.com') || 
                           stream.url.includes('youtu.be') || 
                           stream.url.includes('facebook.com') || 
                           stream.url.includes('fb.watch');
                           
    if (isSocialStream || stream.type === 'youtube' || stream.type === 'facebook') {
      effectiveType = 'auto';
    }

    if (effectiveType === 'auto') {
      const controller = new AbortController();
      setIsLoading(true);
      setLoadingText('جاري جلب البث المباشر حصرياً...');
      setError(false);

      fetch(`${API_BASE}/api/resolve-stream?url=${encodeURIComponent(stream.url)}`, {
        signal: controller.signal
      })
        .then(res => {
          if (!res.ok) throw new Error('API Error');
          return res.json();
        })
        .then(data => {
          setResolvedStream({ ...stream, url: data.streamUrl, type: data.type });
          setLoadingText('');
        })
        .catch(err => {
          if (err.name !== 'AbortError') {
            console.error('Resolve error:', err);
            setIsLoading(false);
            setError(true);
          }
        });

      return () => controller.abort();
    } else {
      setResolvedStream(stream);
    }
  }, [stream]);

  useEffect(() => {
    const currentStream = resolvedStream;
    if (!currentStream) return;

    setError(false);

    if (currentStream.type !== 'm3u8' && currentStream.type !== 'mpd' && currentStream.type !== 'auto') {
      setIsLoading(true);
      setLoadingText('');
      const timer = setTimeout(() => setIsLoading(false), 2000);
      return () => clearTimeout(timer);
    }

    if (!videoRef.current || currentStream.type === 'auto') return;

    setIsLoading(true);
    setLoadingText('');
    const video = videoRef.current;
    let hls: Hls | null = null;
    let dashPlayer: dashjs.MediaPlayerClass | null = null;
    
    if (currentStream.type === 'mpd') {
        dashPlayer = dashjs.MediaPlayer().create();
        dashPlayer.initialize(video, currentStream.url, true);
        dashPlayer.on(dashjs.MediaPlayer.events.PLAYBACK_PLAYING, () => {
          setIsLoading(false);
        });
        dashPlayer.on(dashjs.MediaPlayer.events.ERROR, (e) => {
          setIsLoading(false);
          setError(true);
        });
    } else if (Hls.isSupported() && currentStream.type === 'm3u8') {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        maxLoadRetries: 5,
        maxRetryDelay: 3000,
        liveSyncDurationCount: 3
      } as any);
      hls.loadSource(currentStream.url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        video.play().catch(e => console.log('Autoplay prevented:', e));
      });
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
           setIsLoading(false);
           setError(true);
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl') || video.canPlayType('video/mp4')) {
      video.src = currentStream.url;
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        video.play().catch(e => console.log('Autoplay prevented:', e));
      });
      video.addEventListener('error', () => {
        setIsLoading(false);
        setError(true);
      });
    }
    
    return () => {
      if (hls) {
        hls.destroy();
      }
      if (dashPlayer) {
        dashPlayer.destroy();
      }
    };
  }, [resolvedStream]);

  if (!stream) {
    return (
      <div className="absolute inset-0 w-full h-full bg-[#0f0f13] overflow-hidden flex flex-col items-center justify-center text-center m-0 p-0 border-0">
        <span className="text-6xl mb-4">🏟️</span>
        <p className="text-lg font-semibold text-white">اختر مباراة للمشاهدة</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="absolute inset-0 w-full h-full bg-[#0f0f13] overflow-hidden flex flex-col items-center justify-center text-center m-0 p-0 border-0 z-10">
        <span className="text-4xl mb-3 text-white">⚠️</span>
        <p className="text-base font-semibold text-white">تعذّر تحميل البث — جرب سيرفر آخر</p>
      </div>
    );
  }

  const renderStream = () => {
    const currentStream = resolvedStream;
    if (!currentStream || currentStream.type === 'auto') return null;

    if (currentStream.type === 'm3u8' || currentStream.type === 'mpd' || currentStream.type === 'mp4') {
      return (
        <video 
          ref={videoRef} 
          className="absolute inset-0 w-full h-full object-contain bg-[#0f0f13] m-0 p-0 border-0" 
          controls 
          autoPlay 
          playsInline 
        />
      );
    }

    return (
      <iframe 
        src={currentStream.url}
        allow="autoplay; fullscreen; encrypted-media"
        allowFullScreen
        className="absolute inset-0 w-full h-full border-0 m-0 p-0 bg-[#0f0f13]"
        style={{ border: 'none' }}
      />
    );
  };

  return (
    <div className="absolute inset-0 w-full h-full bg-[#0f0f13] overflow-hidden m-0 p-0 border-0">
      {renderStream()}
      {isLoading && (
        <div className="absolute inset-0 z-50 bg-[#0f0f13] flex flex-col items-center justify-center pointer-events-none gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-[#9D4EDD] border-t-white animate-spin" />
          {loadingText && (
            <p className="text-sm font-semibold text-white/90 drop-shadow">{loadingText}</p>
          )}
        </div>
      )}
    </div>
  );
}
