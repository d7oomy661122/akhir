import { motion } from 'motion/react';
import { Match, Stream } from '../types';
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function ServerDialog({ 
  match, 
  onSelectStream,
  lang,
  onClose,
  theme
}: { 
  match: Match | null, 
  onSelectStream: (stream: Stream) => void,
  lang: string,
  onClose?: () => void,
  theme: 'light' | 'dark'
}) {
  const [servers, setServers] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!match) return;
    
    setLoading(true);
    fetch('/servers.json?t=' + new Date().getTime())
      .then(res => res.json())
      .then(data => {
         const normalizeStr = (str?: string) => {
           if (!str) return '';
           return str.toLowerCase().trim()
             .replace(/[أإآا]/g, 'ا')
             .replace(/[ةه]/g, 'ه')
             .replace(/[^a-z0-9ا-ي]/g, '');
         };

         const matchData = data.matches?.find((m: any) => {
            const mHome = normalizeStr(m?.homeTeam);
            const mAway = normalizeStr(m?.awayTeam);
            const home = normalizeStr(match?.homeTeam?.name);
            const away = normalizeStr(match?.awayTeam?.name);
            
            return mHome && home && mAway && away && ((mHome === home && mAway === away) || (mHome === away && mAway === home));
         });
         
         if (matchData && matchData.servers) {
            setServers(matchData.servers);
         } else {
            setServers(match.streams || []);
         }
      })
      .catch(err => {
         console.error('Failed to load servers:', err);
         setServers(match.streams || []);
      })
      .finally(() => {
         setLoading(false);
      });
  }, [match]);

  if (!match) return null;

  return (
    <motion.div 
      key="server-dialog"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div 
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="bg-[#1a1a24] border border-[#2a2a3a] rounded-[16px] max-w-sm w-full relative z-10 flex flex-col overflow-hidden shadow-2xl"
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        <div className="px-6 py-8 relative">
          {onClose && (
            <button onClick={onClose} className={`absolute top-4 ${lang === 'ar' ? 'left-4' : 'right-4'} p-2 text-gray-400 hover:text-white bg-white/5 rounded-full hover:bg-white/10 transition-colors`}>
              <X className="w-5 h-5" />
            </button>
          )}
          
          <h2 className="text-[18px] font-bold text-white text-center mb-6 mt-2">
            {lang === 'ar' ? 'اختر سيرفر البث' : 'Select Stream Server'}
          </h2>
          
          <div className="flex flex-col gap-3">
            {loading ? (
              <div className="flex justify-center items-center py-6">
                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              </div>
            ) : servers.length > 0 ? (
              servers.map((stream, idx) => (
                <button
                  key={stream.id || idx}
                  onClick={() => onSelectStream(stream)}
                  className="w-full bg-[#0f0f13] border border-[#2a2a3a] hover:border-[#9D4EDD] hover:bg-[#9D4EDD]/10 rounded-xl px-4 py-4 transition-all duration-200 cursor-pointer text-center text-white font-bold text-lg shadow-sm"
                >
                  {stream.name || (lang === 'ar' ? `سيرفر ${idx + 1}` : `Server ${idx + 1}`)}
                </button>
              ))
            ) : (
              <div className="py-4 text-center flex flex-col items-center">
                <span className="text-3xl mb-3 opacity-80">📡</span>
                <span className="text-sm font-semibold text-[#71717a]">
                   {lang === 'ar' ? 'لا يوجد بث متاح حالياً' : 'No streams available currently'}
                </span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
