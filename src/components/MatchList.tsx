import { Match } from '../types';
import { format, parseISO } from 'date-fns';
import { cn } from '../lib/utils';
import { Trophy, Calendar, CalendarX } from 'lucide-react';
import TeamLogo from './TeamLogo';
import { Fragment } from 'react';

function MatchCard({ match, isSelected, onClick, lang, theme }: { match: Match; isSelected: boolean; onClick: () => void; lang: string; theme: 'light' | 'dark' }) {
  const isLive = match.status === 'live';
  const isFinished = match.status === 'finished';

  let statusText = lang === 'ar' ? 'لم تبدأ' : 'Not Started';
  if (match.date && !isLive && !isFinished) {
    try {
       statusText = format(parseISO(match.date), 'HH:mm');
    } catch(e) {}
  }
  if (isLive) statusText = (lang === 'ar' ? '🔴 مباشر ' : '🔴 LIVE ') + (match.matchTime || '');
  if (isFinished) statusText = lang === 'ar' ? 'انتهت المباراة' : 'Finished';

  return (
    <article 
      aria-label={`مباراة ${match.homeTeam.name} ضد ${match.awayTeam.name}`}
      onClick={onClick}
      className={cn(
        "shadow-[0_8px_24px_rgba(0,0,0,0.12)] rounded-[20px] p-5 cursor-pointer relative overflow-hidden mb-5 shrink-0 transition-transform duration-200 border-2",
        isSelected ? "border-[#6A0DAD] scale-[1.02]" : "border-[#9D4EDD] hover:scale-[1.02]",
        theme === 'dark' ? "bg-black/90 backdrop-blur-md shadow-black/50 border-white/10" : "bg-[#FAFAFA]"
      )}
    >
      <div className="flex items-start justify-between relative z-10 w-full pt-1">
        {/* Home Team (Right Side in RTL) */}
        <div className="flex flex-col items-center gap-2 w-1/3">
          <TeamLogo 
            teamId={match.homeTeam.id} 
            teamName={match.homeTeam.name} 
            initialUrl={match.crestHome} 
            className="w-[60px] h-[60px] object-contain drop-shadow-sm" 
          />
          <span className={cn("text-[14px] font-black text-center line-clamp-2 leading-tight", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
            {match.homeTeam.name}
          </span>
        </div>

        {/* Center Info */}
        <div className="flex flex-col items-center justify-start flex-1 mt-1">
           <div className={cn(
             "px-4 py-1.5 rounded-full shadow-sm text-[12px] font-bold tracking-wide text-center max-w-full truncate border",
             isLive ? "bg-red-500/10 text-red-500 border-red-500/20" : 
               theme === 'dark' ? "bg-white/5 text-gray-300 border-white/10" : "bg-gray-200 text-gray-700 border-transparent"
           )}>
             {statusText}
           </div>
           
           {(isLive || isFinished) ? (
              <div className={cn("text-3xl font-black mt-3 mb-1 flex items-center justify-center gap-3 w-full", theme === 'dark' ? 'text-white' : 'text-[#4B0082]')}>
                <span>{match.homeTeam.score}</span>
                <span className="text-[#9D4EDD] text-2xl">-</span>
                <span>{match.awayTeam.score}</span>
              </div>
           ) : (
              <div className="text-2xl font-black mt-4 mb-2 flex items-center justify-center w-full">
                <span className={theme === 'dark' ? 'text-gray-600' : 'text-gray-300'}>VS</span>
              </div>
           )}

           <div className="flex items-center gap-1.5 mt-2">
             <Trophy className="w-3.5 h-3.5 text-[#9D4EDD]" />
             <span className={cn("text-[11px] font-bold text-center line-clamp-1", theme === 'dark' ? 'text-gray-400' : 'text-gray-600')}>{match.competition || (lang === 'ar' ? 'مباراة ودية' : 'Friendly')}</span>
           </div>
        </div>

        {/* Away Team (Left Side in RTL) */}
        <div className="flex flex-col items-center gap-2 w-1/3">
          <TeamLogo 
            teamId={match.awayTeam.id} 
            teamName={match.awayTeam.name} 
            initialUrl={match.crestAway} 
            className="w-[60px] h-[60px] object-contain drop-shadow-sm" 
          />
          <span className={cn("text-[14px] font-black text-center line-clamp-2 leading-tight", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
            {match.awayTeam.name}
          </span>
        </div>
      </div>

      {/* Footer Info */}
      <div className={cn("mt-5 pt-3 flex items-center justify-center px-2 w-full border-t", theme === 'dark' ? 'border-white/10' : 'border-gray-200')}>
         {match.date && (
           <div className={cn("flex items-center gap-2", theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}>
             <Calendar className="w-4 h-4 text-[#9D4EDD]" />
             <span className="text-[12px] font-bold" dir="ltr">
               {format(parseISO(match.date), 'dd/MM/yyyy')}
             </span>
             <span className={cn("text-[11px] font-medium mr-2 rtl:border-r ltr:border-l rtl:pr-2 ltr:pl-2", theme === 'dark' ? 'border-gray-700 text-gray-500' : 'border-gray-300 text-gray-400')}>
                {lang === 'ar' ? '(بالتوقيت المحلي)' : '(Local Time)'}
             </span>
           </div>
         )}
      </div>
    </article>
  );
}

import { useState, useEffect } from 'react';

export default function MatchList({ 
  matches, 
  selectedMatch,
  lang,
  onSelect,
  filter,
  setFilter,
  theme
}: { 
  matches: Match[], 
  selectedMatch?: string,
  lang: string,
  onSelect: (match: Match) => void,
  filter: string,
  setFilter: (f: string) => void,
  theme: 'light' | 'dark'
}) {
  const [internalLoading, setInternalLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState(filter);

  const handleFilterClick = (f: string) => {
    if (f === activeFilter) return;
    setInternalLoading(true);
    setActiveFilter(f);
    setFilter(f);
    
    // Simulate loading to allow UI to breathe and show spinner
    setTimeout(() => {
      setInternalLoading(false);
    }, 500);
  };

  const filteredMatches = matches.filter(m => {
    if (activeFilter === 'live') return m.status === 'live';
    if (activeFilter === 'upcoming') return m.status === 'upcoming';
    if (activeFilter === 'finished') return m.status === 'finished';
    return true;
  });

  return (
    <div className="w-full flex flex-col h-full pt-4 px-4 pb-20">
      {/* Tabs */}
      <nav aria-label="فلترة المباريات" className="flex gap-2 mb-6 shrink-0 bg-black/20 p-1.5 rounded-full backdrop-blur-md border border-white/10">
        {['all', 'live', 'upcoming', 'finished'].map((f) => {
           let tabLabel = f;
           if (lang === 'ar') {
             tabLabel = f === 'all' ? 'الكل' : f === 'live' ? 'مباشر' : f === 'upcoming' ? 'قادمة' : 'انتهت';
           } else {
             tabLabel = f === 'all' ? 'All' : f === 'live' ? 'Live' : f === 'upcoming' ? 'Upcoming' : 'Finished';
           }

           return (
             <button
               key={f}
               onClick={() => handleFilterClick(f)}
               className={cn(
                 "px-3 py-2.5 rounded-full text-[14px] font-black transition-all flex-1 text-center whitespace-nowrap",
                 activeFilter === f 
                   ? "bg-white text-[#4B0082] shadow-sm" 
                   : "text-white/80 hover:text-white hover:bg-white/20"
               )}
             >
               {tabLabel}
             </button>
           );
        })}
      </nav>

      {/* List */}
      <section aria-label="مباريات اليوم" className="flex-1 overflow-y-auto flex flex-col pb-10 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {internalLoading ? (
           <div className="flex flex-col items-center justify-center py-20 flex-1">
              <div className="w-10 h-10 border-4 border-[#9D4EDD] border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className={cn("font-bold tracking-widest text-sm uppercase", theme === 'dark' ? 'text-white' : 'text-[#4B0082]')}>
                 {lang === 'ar' ? 'جاري تحميل المباريات...' : 'LOADING MATCHES...'}
              </p>
           </div>
        ) : filteredMatches.length > 0 ? (
          filteredMatches.map((match, index) => (
            <Fragment key={match.id}>
              <MatchCard 
                match={match} 
                isSelected={selectedMatch === match.id}
                lang={lang}
                theme={theme}
                onClick={() => {
                  if (match.status === 'live' || match.status === 'upcoming') {
                    onSelect(match);
                  }
                }}
              />
            </Fragment>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-white/70 gap-4 mt-10">
            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center shadow-inner p-2 border border-white/10">
               <img 
                 src="https://play-lh.googleusercontent.com/27VqBYbJ5n7Hc9h4ApiZUSlmxxUWx0I32eUtKUJGNKTMTX0VEwK-LFHTeha6YrSIAPDiEKu2tKjrNhEv0H3P8YQ=w240-h480-rw" 
                 alt="No Matches" 
                 loading="lazy"
                 decoding="async"
                 className="w-full h-full object-cover rounded-full grayscale opacity-70"
               />
            </div>
            <p className="text-lg font-bold">
               {lang === 'ar' ? 'لا توجد مباريات حالياً' : 'No matches available'}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
