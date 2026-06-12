import { useState, useRef, useEffect } from 'react';
import { ArrowRight, Loader2, MonitorPlay, Radio, Maximize, Minimize, Volume2, VolumeX, Play } from 'lucide-react';
import screenfull from 'screenfull';
import Hls from 'hls.js';
import { Match } from '../types';

interface UniversalPlayerProps {
  streamUrl: string;
  onBack: () => void;
  lang: 'en' | 'ar';
  match?: Match | null;
}

export default function UniversalPlayer({ streamUrl, onBack, lang, match }: UniversalPlayerProps) {
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [volume, setVolume] = useState(70);
  const [muted, setMuted] = useState(true);
  
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Detect type
  const isYouTube = streamUrl.includes('youtube.com') || streamUrl.includes('youtu.be');
  const isFacebook = streamUrl.includes('facebook.com') || streamUrl.includes('fb.watch');
  const isM3U8 = streamUrl.includes('.m3u8');
  
  const isDirectVideo = isM3U8 || streamUrl.includes('.mp4') || (!isYouTube && !isFacebook && !streamUrl.includes('embed'));

  useEffect(() => {
    if (!isDirectVideo || !videoRef.current) return;

    let hls: Hls | null = null;
    const video = videoRef.current;

    setLoading(true);

    if (Hls.isSupported() && isM3U8) {
      hls = new Hls({ lowLatencyMode: true, backBufferLength: 90 });
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false);
        if (!muted) video.muted = false;
        video.play().catch(e => console.log('Autoplay prevented:', e));
      });
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) setLoading(false);
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl') || streamUrl.includes('.mp4')) {
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        setLoading(false);
        if (!muted) video.muted = false;
        video.play().catch(e => console.log('Autoplay prevented:', e));
      });
    } else {
      setLoading(false);
    }

    return () => {
      if (hls) hls.destroy();
    };
  }, [streamUrl, isDirectVideo, isM3U8, muted]);

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
    if (screenfull.isEnabled) screenfull.on('change', handleFullscreenChange);
    return () => {
      if (screenfull.isEnabled) screenfull.off('change', handleFullscreenChange);
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

  const postMessageToPlayer = (func: string, args: any[]) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func, args }), '*');
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
      postMessageToPlayer('unMute', []);
    } else if (newVol === 0 && !muted) {
      setMuted(true);
      postMessageToPlayer('mute', []);
    }
  };

  const handleToggleMute = () => {
    const newMuted = !muted;
    setMuted(newMuted);
    
    if (isDirectVideo && videoRef.current) {
      videoRef.current.muted = newMuted;
    }
    
    if (newMuted) {
      postMessageToPlayer('mute', []);
    } else {
      postMessageToPlayer('unMute', []);
      if (volume === 0) {
        setVolume(70);
        if (isDirectVideo && videoRef.current) videoRef.current.volume = 0.7;
        postMessageToPlayer('setVolume', [70]);
      } else {
        if (isDirectVideo && videoRef.current) videoRef.current.volume = volume / 100;
        postMessageToPlayer('setVolume', [volume]);
      }
    }
  };

  let embedUrl = streamUrl;
  if (isYouTube) {
    let vId = '';
    if (streamUrl.includes('youtube.com/watch?v=')) vId = streamUrl.split('v=')[1]?.split('&')[0];
    else if (streamUrl.includes('youtu.be/')) vId = streamUrl.split('youtu.be/')[1]?.split('?')[0];
    else if (streamUrl.includes('youtube.com/embed/')) vId = streamUrl.split('embed/')[1]?.split('?')[0];
    else if (streamUrl.includes('youtube.com/live/')) vId = streamUrl.split('live/')[1]?.split('?')[0];
    embedUrl = `https://www.youtube.com/embed/${vId}?autoplay=1&mute=1&playsinline=1&controls=0&rel=0&enablejsapi=1`;
  } else if (isFacebook) {
    embedUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(streamUrl)}&show_text=false&mute=1&autoplay=1`;
  }

  return (
    <div role="main" className="fixed inset-0 w-full h-[100dvh] bg-black overflow-y-auto overflow-x-hidden z-[100] flex flex-col font-sans" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className={`w-full relative flex items-center justify-center shrink-0 ${isFullscreen ? 'flex-1 h-[100dvh] p-0' : 'flex-1 min-h-[100dvh] p-2 sm:p-6 md:p-8'}`}>
        <div 
          ref={playerContainerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={() => setShowControls(c => !c)}
          className={`w-full aspect-video bg-black shadow-[0_0_50px_rgba(0,0,0,0.8)] relative group mx-auto flex items-center justify-center overflow-hidden ${isFullscreen ? 'max-w-none border-none h-full rounded-none' : 'max-w-6xl rounded-[20px] border border-white/10 max-h-[100dvh] sm:max-h-[calc(100dvh-2rem)]'}`}
        >
          {loading && (
             <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#09090b]">
                <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 text-[#00ff88] animate-spin mb-3 sm:mb-4" />
                <p className="text-white/70 font-bold tracking-widest text-xs sm:text-sm uppercase">
                   {lang === 'ar' ? 'جاري الاتصال...' : 'CONNECTING...'}
                </p>
             </div>
          )}

          {isDirectVideo ? (
             <video
               ref={videoRef}
               className="absolute inset-0 w-full h-full object-contain z-10 pointer-events-auto bg-black"
               autoPlay
               playsInline
               muted={muted}
             />
          ) : (
             <div 
               className="absolute z-10 pointer-events-auto flex items-center justify-center bg-black"
               style={{
                 top: isFacebook ? '-15%' : isYouTube ? '-20%' : '0',
                 bottom: isFacebook ? '-15%' : isYouTube ? '-20%' : '0',
                 left: isFacebook ? '-15%' : isYouTube ? '-20%' : '0',
                 right: isFacebook ? '-15%' : isYouTube ? '-20%' : '0',
                 width: isFacebook || isYouTube ? 'auto' : '100%',
                 height: isFacebook || isYouTube ? 'auto' : '100%',
               }}
             >
                <iframe 
                  ref={iframeRef}
                  src={embedUrl}
                  className="w-full h-full border-none pointer-events-auto"
                  allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                  allowFullScreen
                  onLoad={() => setLoading(false)}
                />
             </div>
          )}

          <div 
             className={`absolute inset-0 z-20 pointer-events-none transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0'}`}
             style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 75%, rgba(0,0,0,0.7) 100%)' }}
          >
             <div className="absolute top-0 left-0 right-0 p-3 sm:p-6 flex justify-between items-start gap-2">
                <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
                   <button 
                     onClick={(e) => { e.stopPropagation(); onBack(); }} 
                     className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/20 transition-all cursor-pointer text-white shadow-sm ${lang === 'en' ? 'rotate-180' : ''}`}
                   >
                     <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                   </button>
                   
                   <div className="hidden md:flex items-center gap-2 text-white font-black italic tracking-tighter text-lg sm:text-xl drop-shadow-md">
                      <MonitorPlay className="w-5 h-5 sm:w-6 sm:h-6 text-[#00ff88]" />
                      <span>LIVE<span className="text-[#00ff88]">FOOTBALL365</span></span>
                   </div>
                   
                   <div className="hidden md:block h-4 sm:h-5 w-[1px] bg-white/20 mx-0.5 sm:mx-1"></div>
                   
                   <div className="px-2 sm:px-2 py-0.5 sm:py-1 bg-red-600 rounded text-white text-[10px] sm:text-xs font-black tracking-widest shadow-lg flex items-center gap-1 sm:gap-2 border border-red-500 relative overflow-hidden pointer-events-auto">
                      <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                      <Radio className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> <span className="pt-0.5">LIVE</span>
                   </div>

                   {match && (
                     <div className="hidden lg:flex bg-black/40 backdrop-blur-md px-3 py-1.5 rounded text-white text-sm font-semibold tracking-wide border border-white/10 shadow-sm ml-2 items-center gap-2 pointer-events-auto text-nowrap whitespace-nowrap overflow-hidden text-ellipsis max-w-xs xl:max-w-md">
                        {match.homeTeam.flag && <img src={match.homeTeam.flag} alt={`علم ${match.homeTeam.name}`} loading="lazy" decoding="async" className="w-4 h-4 object-contain" />}
                        <span>{match.homeTeam.name}</span>
                        <span className="text-white/50 mx-1">vs</span>
                        <span>{match.awayTeam.name}</span>
                        {match.awayTeam.flag && <img src={match.awayTeam.flag} alt={`علم ${match.awayTeam.name}`} loading="lazy" decoding="async" className="w-4 h-4 object-contain" />}
                     </div>
                   )}
                </div>
                
                <div className="flex items-center gap-2 pointer-events-auto">
                   <span className="text-[#00ff88] text-[10px] sm:text-xs font-bold tracking-widest uppercase px-1.5 sm:px-2 py-0.5 sm:py-1 bg-gradient-to-r from-[#00ff88]/20 to-transparent rounded border border-[#00ff88]/30 backdrop-blur-md flex items-center gap-1 sm:gap-1.5 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse"></span>
                      1080p<span className="hidden sm:inline"> HD</span>
                   </span>
                </div>
             </div>

             <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-6 flex justify-between items-end pointer-events-none">
                <div className="flex items-center gap-2 pointer-events-auto bg-black/40 backdrop-blur-md p-1.5 sm:p-2 pl-2 sm:pl-3 rounded-full border border-white/10 group/volume overflow-hidden transition-all duration-300">
                   <button 
                     onClick={(e) => { e.stopPropagation(); handleToggleMute(); }} 
                     className="text-white hover:text-[#00ff88] transition-colors p-0.5 sm:p-0"
                   >
                     {muted || volume === 0 ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />}
                   </button>
                   <input 
                     type="range"
                     min={0}
                     max={100}
                     value={muted ? 0 : volume}
                     onChange={(e) => { e.stopPropagation(); handleVolumeChange(e); }}
                     className="w-0 sm:w-20 lg:w-24 overflow-hidden md:w-0 group-hover/volume:w-16 sm:group-hover/volume:w-24 transition-all duration-300 accent-[#00ff88] h-1.5 cursor-pointer opacity-0 group-hover/volume:opacity-100 bg-white/20 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 sm:[&::-webkit-slider-thumb]:w-3 sm:[&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full ml-1"
                   />
                </div>

                <button 
                  onClick={(e) => { e.stopPropagation(); handleToggleFullscreen(); }} 
                  className="pointer-events-auto text-white hover:text-[#00ff88] hover:bg-white/10 bg-black/40 backdrop-blur-md p-2 sm:p-2.5 rounded-full transition-all border border-white/10"
                >
                   {isFullscreen ? <Minimize className="w-4 h-4 sm:w-5 sm:h-5" /> : <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
