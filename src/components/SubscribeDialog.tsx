import { useState, useEffect } from 'react';
import { Youtube, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { AnimatePresence, motion } from 'motion/react';

export default function SubscribeDialog({ lang, theme }: { lang: 'ar' | 'en'; theme: 'light' | 'dark' }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user has already seen or subscribed
    const hasSubscribed = localStorage.getItem('livefootball365_yt_subscribed');
    if (!hasSubscribed) {
      // Delay showing the dialog slightly for better UX
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleSubscribe = () => {
    window.open('https://youtube.com/@livefootball365?si=_fzMJePRzP0EgJrt', '_blank');
    localStorage.setItem('livefootball365_yt_subscribed', 'true');
    setIsOpen(false);
  };

  const handleClose = () => {
    localStorage.setItem('livefootball365_yt_subscribed', 'true'); // don't annoy them again to keep it professional
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className={cn(
              "relative w-full max-w-sm rounded-[24px] p-6 shadow-2xl flex flex-col items-center text-center border overflow-hidden",
              theme === 'dark' ? "bg-[#121212] border-white/10" : "bg-white border-gray-100"
            )}
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
          >
             {/* Dynamic gradient background */}
             <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-500/20 rounded-full blur-[40px] pointer-events-none" />
             <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#6A0DAD]/20 rounded-full blur-[40px] pointer-events-none" />

             <button 
               onClick={handleClose}
               className={cn(
                 "absolute top-4 rtl:left-4 ltr:right-4 p-2 rounded-full transition-colors z-10",
                 theme === 'dark' ? "bg-white/5 hover:bg-white/10 text-white/50 hover:text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900"
               )}
             >
               <X className="w-4 h-4" />
             </button>

             <div className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 bg-red-500 rounded-full flex flex-col items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.4)] mb-5">
                   <Youtube className="w-10 h-10 text-white translate-x-0.5" />
                </div>

                <h2 className={cn("text-2xl font-black mb-2", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                  {lang === 'ar' ? 'اشترك في قناتنا!' : 'Subscribe Now!'}
                </h2>
                
                <p className={cn("text-sm font-medium mb-8 max-w-[260px] leading-relaxed", theme === 'dark' ? 'text-gray-400' : 'text-gray-600')}>
                  {lang === 'ar' 
                    ? 'اشترك في قناة LiveFootball365 على يوتيوب واستمتع بمشاهدة المباريات الحصرية بدون انقطاع وبأعلى جودة.'
                    : 'Subscribe to the LiveFootball365 YouTube channel and enjoy watching exclusive matches in HD quality.'}
                </p>

                <button 
                  onClick={handleSubscribe}
                  className="w-full relative overflow-hidden group bg-red-600 hover:bg-red-700 text-white rounded-full py-4 px-6 font-bold text-lg shadow-[0_8px_20px_rgba(239,68,68,0.3)] transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
                >
                  <span className="relative z-10">{lang === 'ar' ? 'اشترك الآن' : 'Subscribe'}</span>
                  <Youtube className="w-5 h-5 relative z-10" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1s_infinite] pointer-events-none" />
                </button>
                
                <button onClick={handleClose} className={cn("mt-4 text-xs font-bold uppercase tracking-wider", theme === 'dark' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600')}>
                   {lang === 'ar' ? 'لا شكرا، سأكمل التصفح' : 'No thanks, continue browsing'}
                </button>
             </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
