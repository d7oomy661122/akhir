import { useEffect, useRef } from 'react';

export default function BannerAd({ adKey, width, height }: { adKey: string, width: number, height: number }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';
    
    const script1 = document.createElement('script');
    script1.type = 'text/javascript';
    script1.innerHTML = `
      atOptions = {
        'key' : '${adKey}',
        'format' : 'iframe',
        'height' : ${height},
        'width' : ${width},
        'params' : {}
      };
    `;
    
    const script2 = document.createElement('script');
    script2.type = 'text/javascript';
    script2.src = `https://www.highperformanceformat.com/${adKey}/invoke.js`;
    
    containerRef.current.appendChild(script1);
    containerRef.current.appendChild(script2);
  }, [adKey, width, height]);

  return (
    <div className="flex justify-center w-full my-3 overflow-hidden shrink-0">
        <div ref={containerRef} style={{ minHeight: height > 100 ? 50 : height, minWidth: width > 320 ? 320 : width, display: 'flex', justifyContent: 'center' }} />
    </div>
  );
}
