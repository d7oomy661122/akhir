
import { useEffect, useRef } from 'react';

export default function NativeAd() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '<div id="container-8633ae7d42f020cb369991ea50f9aa6e"></div>';
    
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.dataset.cfasync = 'false';
    script.src = 'https://pl29738091.effectivecpmnetwork.com/8633ae7d42f020cb369991ea50f9aa6e/invoke.js';
    
    containerRef.current.appendChild(script);
  }, []);

  return (
    <div className="flex justify-center w-full my-4 overflow-hidden shrink-0">
        <div ref={containerRef} className="w-full max-w-full flex justify-center" />
    </div>
  );
}
