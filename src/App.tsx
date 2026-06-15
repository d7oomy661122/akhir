
import { useState, useEffect } from 'react';
import Header from './components/Header';
import MatchList from './components/MatchList';
import ServerDialog from './components/ServerDialog';
import BannerAd from './components/BannerAd';
import SubscribeDialog from './components/SubscribeDialog';
import UniversalPlayer from './components/UniversalPlayer';
import { AnimatePresence } from 'motion/react';
import { Match, Stream } from './types';
import { useMatches } from './hooks/useMatches';
import { cn } from './lib/utils';
import { injectMatchListSchema, updateMatchSEO } from './utils/seo';

export default function App() {
  const { matches, loading, error } = useMatches();
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [view, setView] = useState<'home' | 'player'>('home');
  const [dialogMatch, setDialogMatch] = useState<Match | null>(null);
  const [activeMatch, setActiveMatch] = useState<Match | null>(null);
  const [activeStream, setActiveStream] = useState<Stream | null>(null);
  
  const [filter, setFilter] = useState('all');
  const [pageLoading, setPageLoading] = useState(false);

  useEffect(() => {
    if (matches && matches.length > 0) {
      injectMatchListSchema(matches);
    }
  }, [matches]);

  useEffect(() => {
    if (view === 'player') {
       updateMatchSEO(activeMatch);
    } else {
       updateMatchSEO(null);
    }
  }, [view, activeMatch]);

  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [theme]);

  const handleFilterChange = (f: string) => {
    if (f === filter) return;
    setFilter(f);
  };

  const handleMatchClick = (match: Match) => {
    if (match.status === 'live') {
      setDialogMatch(match);
    } else if (match.status === 'upcoming') {
      const matchDate = new Date(match.date);
      const now = new Date();
      const diffHours = (matchDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      if (diffHours <= 3 || isNaN(diffHours)) {
        setDialogMatch(match);
      }
    }
  };

  const handleServerSelect = (stream: Stream) => {
    const currentMatch = dialogMatch;
    setDialogMatch(null);
    setPageLoading(true);
    
    setTimeout(() => {
      setActiveStream(stream);
      setActiveMatch(currentMatch);
      setView('player');
      setPageLoading(false);
    }, 300);
  };

  const handleBack = () => {
    setPageLoading(true);
    setTimeout(() => {
      setView('home');
      setActiveStream(null);
      setActiveMatch(null);
      setPageLoading(false);
    }, 1000);
  };

  const liveCount = matches.filter(m => m.status === 'live').length;

  return (
    <div className="min-h-[100dvh] font-sans flex flex-col relative" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="fixed inset-0 bg-black/5 pointer-events-none" />

      <Header 
        liveCount={liveCount} 
        lang={lang} 
        toggleLang={() => setLang(l => l === 'en' ? 'ar' : 'en')} 
        theme={theme}
        toggleTheme={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
      />

      <div className="flex-1 w-full flex flex-col relative z-10">
      
         {view === 'player' && activeMatch && activeStream ? (
           <div className="flex-1 flex flex-col relative">
              {pageLoading ? (
                 <div className="flex-1 flex flex-col items-center justify-center py-20">
                    <div className="w-12 h-12 border-4 border-[#9D4EDD] border-t-transparent rounded-full animate-spin"></div>
                    <p className={cn("mt-4 font-bold tracking-widest", theme === 'dark' ? 'text-white' : 'text-[#4B0082]')}>
                      {lang === 'ar' ? 'جاري التحضير...' : 'PREPARING...'}
                    </p>
                 </div>
              ) : (
                <UniversalPlayer 
                  streamUrl={activeStream.url}
                  match={activeMatch}
                  lang={lang}
                  onBack={handleBack}
                />
              )}
           </div>
         ) : (
           <div className="flex-1 w-full flex justify-center max-w-[800px] mx-auto relative z-10">
              <main role="main" aria-label="قائمة المباريات" className="flex-1 w-full relative flex flex-col pt-4 mx-2 lg:mx-4 pb-4">
                <h1 className="sr-only">بث مباشر كأس العالم 2026 - LiveFootball365</h1>
                
                {/* Ad 1 - top banner */}
                <div className="flex justify-center mb-6 w-full overflow-hidden">
                  <BannerAd adKey="7c620cdf0641c01a146c38a235345706" width={468} height={60} />
                </div>
                
                {(loading && matches.length === 0) || pageLoading ? (
                   <div className="flex-1 flex flex-col items-center justify-center py-20">
                      <div className="w-10 h-10 border-4 border-[#9D4EDD] border-t-transparent rounded-full animate-spin mb-4"></div>
                      <p className={cn("font-bold tracking-widest", theme === 'dark' ? 'text-white' : 'text-[#4B0082]')}>
                        {lang === 'ar' ? 'جاري التحضير...' : 'LOADING...'}
                      </p>
                   </div>
                ) : error && matches.length === 0 ? (
                   <div className="flex-1 flex flex-col items-center justify-center py-20 text-center gap-3">
                     <span className="text-5xl">⚠️</span>
                     <p className={cn("font-bold text-lg drop-shadow-md", theme === 'dark' ? 'text-white' : 'text-[#4B0082]')}>
                       {lang === 'ar' ? 'حدث خطأ في جلب البيانات' : 'Error fetching data'}
                     </p>
                   </div>
                ) : (
                   <MatchList 
                      matches={matches} 
                      selectedMatch={activeMatch?.id || dialogMatch?.id} 
                      lang={lang}
                      onSelect={handleMatchClick}
                      filter={filter}
                      setFilter={handleFilterChange}
                      theme={theme}
                   />
                )}
              </main>
           </div>
         )}
         
      </div>

      {/* Ad 2 - bottom banner */}
      {!pageLoading && view !== 'player' && (
         <div className="w-full relative z-10 mx-auto px-2 lg:px-4 shrink-0 flex justify-center pb-4 overflow-hidden">
            <BannerAd adKey="7c620cdf0641c01a146c38a235345706" width={468} height={60} />
         </div>
      )}
      
      <AnimatePresence>
        {dialogMatch && (
          <ServerDialog 
            match={dialogMatch} 
            lang={lang}
            onSelectStream={handleServerSelect}
            onClose={() => setDialogMatch(null)}
            theme={theme}
          />
        )}
      </AnimatePresence>
      
      <SubscribeDialog lang={lang} theme={theme} />

      {/* Hidden SEO content for crawlers */}
      <section className="sr-only" aria-hidden="true" id="seo-content">
        <h2>بث مباشر كأس العالم 2026</h2>
        <p>
          LiveFootball365 هو الموقع الأول لمشاهدة مباريات كأس العالم 2026 بث مباشر مجاني وبجودة عالية. يمكنك متابعة جميع مباريات
          المونديال من المرحلة الجماعية حتى النهائي. شاهد مباراة المغرب، السعودية، مصر، وجميع المنتخبات العربية في كأس العالم FIFA 2026 المقام في أمريكا والمكسيك وكندا.
        </p>
        <h2>World Cup 2026 Live Stream Free</h2>
        <p>
          Watch FIFA World Cup 2026 live stream for free on LiveFootball365. All matches available in HD quality with multiple servers. Morocco, Saudi Arabia, Egypt and all Arab teams live coverage.
        </p>
        <ul>
          <li>بث مباشر المغرب كأس العالم 2026</li>
          <li>بث مباشر السعودية مونديال 2026</li>
          <li>مشاهدة مباريات كأس العالم مجانا</li>
          <li>يلا شوت بث مباشر كأس العالم</li>
          <li>كورة لايف مونديال 2026</li>
          <li>Watch World Cup 2026 live free online</li>
          <li>FIFA World Cup 2026 free live stream</li>
        </ul>
      </section>
    </div>
  );
}
