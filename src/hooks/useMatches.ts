import { useState, useEffect } from 'react';
import { Match } from '../types';

export function useMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchMatches = async () => {
      try {
        const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard?_=${new Date().getTime()}`;
        const res = await fetch(url);

        if (!res.ok) {
          throw new Error('Failed to fetch from ESPN API');
        }

        const data = await res.json();
        
        if (data.events && isMounted) {
          const mappedMatches: Match[] = data.events.map((event: any) => {
            const comp = event.competitions?.[0];
            const home = comp?.competitors?.find((c: any) => c.homeAway === 'home');
            const away = comp?.competitors?.find((c: any) => c.homeAway === 'away');
            
            let status: Match['status'] = 'upcoming';
            let matchTime: string | null = null;
            
            const state = comp?.status?.type?.state;
            if (state === 'in') {
              status = 'live';
              matchTime = comp?.status?.displayClock || comp?.status?.type?.detail || 'مباشر';
            } else if (state === 'post') {
              status = 'finished';
              matchTime = 'FT';
            } else {
              status = 'upcoming';
              matchTime = null;
            }
            
            const homeScore = home?.score ? parseInt(home.score, 10) : null;
            const awayScore = away?.score ? parseInt(away.score, 10) : null;
            
            const compName = event.season?.slug 
              ? event.season.slug.replace(/-/g, ' ').toUpperCase()
              : 'Unknown Competition';

            return {
              id: event.id.toString(),
              status,
              matchTime,
              date: event.date || comp?.date || new Date().toISOString(),
              stadium: comp?.venue?.fullName || 'Unknown Stadium',
              competition: compName,
              homeTeam: {
                id: home?.team?.id,
                name: home?.team?.displayName || 'Home',
                flag: '',
                score: !isNaN(homeScore as number) ? homeScore : null
              },
              awayTeam: {
                id: away?.team?.id,
                name: away?.team?.displayName || 'Away',
                flag: '',
                score: !isNaN(awayScore as number) ? awayScore : null
              },
              crestHome: home?.team?.logo,
              crestAway: away?.team?.logo,
              streams: [],
              broadcasters: comp?.broadcasts?.map((b: any) => b.names?.[0] || b.market) || []
            };
          });

          setMatches(mappedMatches);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchMatches();
    const intervalId = setInterval(fetchMatches, 30000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  return { matches, loading, error };
}
