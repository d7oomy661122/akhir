import { useEffect, useState, useRef } from 'react';
import { Match, Stream } from '../types';
import { ArrowRight, Loader2, MonitorPlay, Radio, Maximize, Minimize, Volume2, VolumeX } from 'lucide-react';
import screenfull from 'screenfull';
import Hls from 'hls.js';
import BannerAd from './BannerAd';
import { updateMatchSEO } from '../utils/seo';

interface PlayerPageProps {
  match: Match;
  stream: Stream;
  lang: string;
  onBack?: () => void;
}

export default function PlayerPage({ match, stream, lang, onBack }: PlayerPageProps) {
  const [activeServer] = useState<Stream>(stream);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    updateMatchSEO(match);
    return () => updateMatchSEO(null);
  }, [match]);
  
  // Player state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [volume, setVolume] = useState(70);
  const [muted, setMuted] = useState(true); // Default muted to allow autoplay
  const [smartlinkClicks, setSmartlinkClicks] = useState(0);

  const playerContainerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Is this stream a direct m3u8/video link?
  const isDirectVideo = activeServer.type === 'm3u8' || activeServer.type === 'mpd' || activeServer.type === 'mp4' || (!activeServer.url.includes('youtube') && !activeServer.url.includes('youtu.be') && !activeServer.url.includes('embed'));

  useEffect(() => {
    if (!isDirectVideo || !videoRef.current) return;

    let hls: Hls | null = null;
    const video = videoRef.current;

    setLoading(true);

    if (Hls.isSupported() && activeServer.url.includes('.m3u8')) {
      hls = new Hls({
        lowLatencyMode: true,
        backBufferLength: 90,
      });
      hls.loadSource(activeServer.url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false);
        if (!muted) video.muted = false;
        video.play().catch(e => console.log('Autoplay prevented:', e));
      });
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) setLoading(false);
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl') || activeServer.url.includes('.mp4')) {
      video.src = activeServer.url;
      video.addEventListener('loadedmetadata', () => {
        setLoading(false);
        if (!muted) video.muted = false;
        video.play().catch(e => console.log('Autoplay prevented:', e));
      });
    } else {
      setLoading(false); // fallback let the browser handle it
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [activeServer, isDirectVideo, muted]);

  const postMessageToPlayer = (func: string, args: any[]) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func, args }),
        '*'
      );
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseInt(e.target.value, 10);
    setVolume(newVol);
    
    if (isDirectVideo && videoRef.current) {
      videoRef.current.volume = newVol / 100;
      videoRef.current.muted = newVol === 0;
    } else {
      postMessageToPlayer('setVolume', [newVol]);
    }
    
    if (newVol > 0 && muted) {
      setMuted(false);
      if (!isDirectVideo) postMessageToPlayer('unMute', []);
    } else if (newVol === 0 && !muted) {
      setMuted(true);
      if (!isDirectVideo) postMessageToPlayer('mute', []);
    }
  };

  const handleToggleMute = () => {
    const newMuted = !muted;
    setMuted(newMuted);
    
    if (isDirectVideo && videoRef.current) {
      videoRef.current.muted = newMuted;
    }
    
    if (newMuted) {
      if (!isDirectVideo) postMessageToPlayer('mute', []);
    } else {
      if (!isDirectVideo) postMessageToPlayer('unMute', []);
      if (volume === 0) {
        setVolume(70);
        if (isDirectVideo && videoRef.current) videoRef.current.volume = 0.7;
        if (!isDirectVideo) postMessageToPlayer('setVolume', [70]);
      } else {
        if (isDirectVideo && videoRef.current) videoRef.current.volume = volume / 100;
        if (!isDirectVideo) postMessageToPlayer('setVolume', [volume]);
      }
    }
  };

  const handleToggleFullscreen = () => {
    if (screenfull.isEnabled && playerContainerRef.current) {
      if (screenfull.isFullscreen) {
        screenfull.exit();
      } else {
        screenfull.request(playerContainerRef.current);
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(screenfull.isFullscreen);
    };

    if (screenfull.isEnabled) {
      screenfull.on('change', handleFullscreenChange);
    }

    return () => {
      if (screenfull.isEnabled) {
        screenfull.off('change', handleFullscreenChange);
      }
    };
  }, []);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
  };

  const handleMouseLeave = () => {
    setShowControls(false);
  };

  // Extract YouTube ID from url
  const getYouTubeId = (url: string) => {
    let vId = '';
    if (url.includes('youtube.com/watch?v=')) {
      vId = url.split('v=')[1]?.split('&')[0];
    } else if (url.includes('youtu.be/')) {
      vId = url.split('youtu.be/')[1]?.split('?')[0];
    } else if (url.includes('youtube.com/embed/')) {
      vId = url.split('embed/')[1]?.split('?')[0];
    } else if (url.includes('youtube.com/live/')) {
      vId = url.split('live/')[1]?.split('?')[0];
    }
    return vId;
  };

  const vId = getYouTubeId(activeServer.url);

  // Use proper responsive YouTube iframe embed
  const embedUrl = vId 
    ? `https://www.youtube.com/embed/${vId}?autoplay=1&mute=1&playsinline=1&controls=0&rel=0&enablejsapi=1` 
    : activeServer.url;
    
  const handleSmartlinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open('https://www.effectivecpmnetwork.com/aqvr5qwv9?key=04dcea856855796b247a2fd6bce092ca', '_blank');
    setSmartlinkClicks(c => c + 1);
  };
  
  return (
    <div role="main" className="fixed inset-0 w-[100vw] h-[100dvh] bg-black overflow-y-auto overflow-x-hidden z-[100] flex flex-col font-sans [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Top Banner Ad Container */}
      {!isFullscreen && (
         <div className="w-full flex justify-center py-2 shrink-0 my-auto lg:my-0 lg:py-6">
            <BannerAd adKey="3937e4376bd8b4cdcacd7b5a3fcce7e3" width={300} height={250} />
         </div>
      )}

      {/* Main Broadcast Player Area */}
      <div className={`w-full relative flex items-center justify-center p-0 shrink-0 ${isFullscreen ? 'flex-1 h-[100dvh]' : ''}`}>
        
        {/* 16:9 Aspect Ratio Container for the Player with CSS Masking strategy */}
        <div 
          role="region" aria-label="مشغل البث المباشر"
          ref={playerContainerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={() => {
            // Mobile toggle hover states
            setShowControls(!showControls);
            if (!showControls && controlsTimeoutRef.current) {
               clearTimeout(controlsTimeoutRef.current);
               controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
            }
          }}
          className={`w-full max-w-6xl aspect-video bg-black overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] relative group ${isFullscreen ? 'max-w-none md:border-none' : 'md:rounded-2xl md:border border-white/10'}`}
        >
          {loading && (
             <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#09090b]">
                <Loader2 className="w-10 h-10 text-red-500 animate-spin mb-4" />
                <p className="text-white/70 font-semibold tracking-widest text-sm uppercase">
                   {lang === 'ar' ? 'جاري الاتصال بالبث...' : 'CONNECTING TO BROADCAST...'}
                </p>
             </div>
          )}

          {isDirectVideo ? (
             <video
               ref={videoRef}
               className="absolute inset-0 w-full h-full z-10 pointer-events-auto bg-black"
               autoPlay
               playsInline
               muted={muted}
             />
          ) : (
             <div 
                className="absolute left-0 w-full z-10 pointer-events-auto"
                style={{ top: '-50%', height: '200%' }}
             >
                <iframe 
                  ref={iframeRef}
                  src={embedUrl}
                  className="w-full h-full border-none"
                  allow="autoplay; encrypted-media; fullscreen"
                  allowFullScreen
                  onLoad={() => setLoading(false)}
                />
             </div>
          )}

          {/* Custom Controls Overlay ABOVE the iframe */}
          <div 
             className={`absolute inset-0 z-20 pointer-events-none transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0'}`}
             style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 75%, rgba(0,0,0,0.7) 100%)' }}
          >
             {/* Header in player */}
             <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 flex flex-wrap justify-between items-start gap-4">
                {/* Top Left Area */}
                <div className="flex items-center gap-3 pointer-events-auto">
                   {/* Back Button */}
                   <button 
                     onClick={(e) => { e.stopPropagation(); onBack?.(); }} 
                     aria-label="العودة للصفحة الرئيسية"
                     className={`w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/20 transition-all cursor-pointer text-white shadow-sm ${lang === 'en' ? 'rotate-180' : ''}`}
                   >
                     <ArrowRight className="w-5 h-5" />
                   </button>
                   
                   {/* Custom Logo */}
                   <div className="flex items-center gap-2 text-white font-black italic tracking-tighter text-xl drop-shadow-md">
                      <MonitorPlay className="w-6 h-6 text-[#00ff88]" />
                      <span className="hidden sm:inline">SPORT<span className="text-[#00ff88]">PRIME</span></span>
                   </div>
                   
                   <div className="hidden sm:block h-5 w-[1px] bg-white/20 mx-1"></div>
                   
                    {/* Live Badge */}
                   <div className="px-2 py-1 bg-red-600 rounded text-white text-xs font-black tracking-widest shadow-lg flex items-center gap-2 border border-red-500 relative overflow-hidden pointer-events-auto">
                      <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                      <Radio className="w-3.5 h-3.5" /> LIVE
                   </div>

                   {/* Match Info Bar */}
                   <div className="hidden md:flex bg-black/40 backdrop-blur-md px-3 py-1.5 rounded text-white text-sm font-semibold tracking-wide border border-white/10 shadow-sm ml-2 items-center gap-2">
                       {match.homeTeam.flag && <img src={match.homeTeam.flag} alt={`علم ${match.homeTeam.name}`} loading="lazy" decoding="async" className="w-4 h-4 object-contain" />}
                       <span>{match.homeTeam.name}</span>
                       <span className="text-white/50 mx-1">vs</span>
                       <span>{match.awayTeam.name}</span>
                       {match.awayTeam.flag && <img src={match.awayTeam.flag} alt={`علم ${match.awayTeam.name}`} loading="lazy" decoding="async" className="w-4 h-4 object-contain" />}
                   </div>
                </div>
                
                {/* Top Right Area (Quality Badge) */}
                <div className="flex items-center pointer-events-auto">
                   <span className="text-[#00ff88] text-xs font-bold tracking-widest uppercase px-2 py-1 bg-gradient-to-r from-[#00ff88]/20 to-transparent rounded border border-[#00ff88]/30 backdrop-blur-md flex items-center gap-1.5 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse"></span>
                      1080p HD
                   </span>
                </div>
             </div>

             {/* Bottom Area (Controls) */}
             <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 flex justify-between items-end pointer-events-none">
                {/* Left Controls (Volume) */}
                <div className="flex items-center gap-2 pointer-events-auto bg-black/40 backdrop-blur-md p-2 pl-3 rounded-full border border-white/10 group/volume overflow-hidden transition-all duration-300">
                   <button 
                     onClick={(e) => { e.stopPropagation(); handleToggleMute(); }} 
                     className="text-white hover:text-[#00ff88] transition-colors"
                   >
                     {muted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                   </button>
                   <input 
                     type="range"
                     min={0}
                     max={100}
                     value={muted ? 0 : volume}
                     onChange={(e) => { e.stopPropagation(); handleVolumeChange(e); }}
                     className="w-0 sm:w-20 lg:w-24 overflow-hidden md:w-0 group-hover/volume:w-24 transition-all duration-300 accent-[#00ff88] h-1.5 cursor-pointer opacity-0 group-hover/volume:opacity-100 bg-white/20 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full ml-1"
                   />
                </div>

                {/* Right Controls (Fullscreen) */}
                <button 
                  onClick={(e) => { e.stopPropagation(); handleToggleFullscreen(); }} 
                  className="pointer-events-auto text-white hover:text-[#00ff88] hover:bg-white/10 bg-black/40 backdrop-blur-md p-2.5 rounded-full transition-all border border-white/10"
                >
                   {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                </button>
             </div>
          </div>

          {/* Smartlink Protection Layer - intercepts clicks on the player for the first 3 interactions */}
          {smartlinkClicks < 3 && (
            <div 
              className="absolute inset-0 z-[60] cursor-pointer"
              onClick={handleSmartlinkClick}
            />
          )}
        </div>
      </div>

      {/* Bottom Banner Ad Container */}
      {!isFullscreen && (
         <div className="w-full flex justify-center py-2 shrink-0 my-auto lg:my-0 lg:py-6">
            <BannerAd adKey="3937e4376bd8b4cdcacd7b5a3fcce7e3" width={300} height={250} />
         </div>
      )}
    </div>
  );
}
