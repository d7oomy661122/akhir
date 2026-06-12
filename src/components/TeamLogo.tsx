import { useState, useEffect } from 'react';

interface TeamLogoProps {
  teamId?: string;
  teamName: string;
  initialUrl?: string;
  className?: string;
}

// 50 popular teams fallback database (clubs and national teams)
const POPULAR_TEAMS: Record<string, string> = {
  'real madrid': 'https://www.thesportsdb.com/images/media/team/badge/7w0mup1704288075.png',
  'barcelona': 'https://www.thesportsdb.com/images/media/team/badge/xswxxq1473501705.png',
  'manchester united': 'https://www.thesportsdb.com/images/media/team/badge/xyusrc1427503525.png',
  'liverpool': 'https://www.thesportsdb.com/images/media/team/badge/uruvqw1427503463.png',
  'arsenal': 'https://www.thesportsdb.com/images/media/team/badge/uyyqww1427503370.png',
  'chelsea': 'https://www.thesportsdb.com/images/media/team/badge/wwqwuq1427503396.png',
  'manchester city': 'https://www.thesportsdb.com/images/media/team/badge/vsvvqq1427503507.png',
  'bayern munich': 'https://www.thesportsdb.com/images/media/team/badge/wpvuqv1433934335.png',
  'paris saint germain': 'https://www.thesportsdb.com/images/media/team/badge/rwqrpt1473502878.png',
  'juventus': 'https://www.thesportsdb.com/images/media/team/badge/qvvppt1473506161.png',
  'ac milan': 'https://www.thesportsdb.com/images/media/team/badge/qpwtst1473504899.png',
  'inter milan': 'https://www.thesportsdb.com/images/media/team/badge/uxqrxt1473505672.png',
  'atletico madrid': 'https://www.thesportsdb.com/images/media/team/badge/tqtxxu1473501605.png',
  'borussia dortmund': 'https://www.thesportsdb.com/images/media/team/badge/vptvws1473505051.png',
  'napoli': 'https://www.thesportsdb.com/images/media/team/badge/qwqsyt1473506253.png',
  'tottenham': 'https://www.thesportsdb.com/images/media/team/badge/tswtys1473504192.png',
  'argentina': 'https://www.thesportsdb.com/images/media/team/badge/xqusru1485966601.png',
  'brazil': 'https://www.thesportsdb.com/images/media/team/badge/wqtuxr1485966213.png',
  'france': 'https://www.thesportsdb.com/images/media/team/badge/qxxwyw1485966532.png',
  'england': 'https://www.thesportsdb.com/images/media/team/badge/yrtuqx1485960012.png',
  'spain': 'https://www.thesportsdb.com/images/media/team/badge/xxwwus1485966666.png',
  'germany': 'https://www.thesportsdb.com/images/media/team/badge/wutxpp1485966455.png',
  'italy': 'https://www.thesportsdb.com/images/media/team/badge/sryxpt1485966050.png',
  'portugal': 'https://www.thesportsdb.com/images/media/team/badge/qtwrxt1485966378.png',
  'netherlands': 'https://www.thesportsdb.com/images/media/team/badge/sxvvqp1485966277.png',
  'belgium': 'https://www.thesportsdb.com/images/media/team/badge/rttrxx1485965672.png',
  'morocco': 'https://www.thesportsdb.com/images/media/team/badge/2s0s3o1668449767.png',
  'egypt': 'https://www.thesportsdb.com/images/media/team/badge/xvtutr1486047249.png',
  'saudi arabia': 'https://www.thesportsdb.com/images/media/team/badge/rxysqp1486047535.png',
  'qatar': 'https://www.thesportsdb.com/images/media/team/badge/srwssq1486047805.png',
};

export default function TeamLogo({ teamId, teamName, initialUrl, className }: TeamLogoProps) {
  const espnUrl = teamId ? `https://a.espncdn.com/i/teamlogos/soccer/500/${teamId}.png` : initialUrl;
  const [imgSrc, setImgSrc] = useState<string | undefined>(espnUrl || initialUrl);
  const [errorLevel, setErrorLevel] = useState(0);

  useEffect(() => {
    setImgSrc(espnUrl || initialUrl);
    setErrorLevel(0);
  }, [teamId, initialUrl, espnUrl]);

  const applyFallback = (nextLevel: number) => {
    if (!teamName) {
       setImgSrc(undefined);
       setErrorLevel(4);
       return;
    }
    const lowerName = teamName.toLowerCase().trim();
    const foundFallback = Object.keys(POPULAR_TEAMS).find(k => lowerName.includes(k) || k.includes(lowerName));
    if (foundFallback) {
      setImgSrc(POPULAR_TEAMS[foundFallback]);
      setErrorLevel(nextLevel);
    } else {
      setImgSrc(undefined);
      setErrorLevel(4);
    }
  };

  const handleError = () => {
    if (errorLevel === 0) {
      if (initialUrl && initialUrl !== espnUrl) {
         setImgSrc(initialUrl);
         setErrorLevel(1);
         return;
      }
      setErrorLevel(1);
    }
    
    if (errorLevel === 0 || errorLevel === 1) {
      const fetchSportsDb = async () => {
        try {
          const res = await fetch(`https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(teamName)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.teams && data.teams.length > 0 && data.teams[0].strTeamBadge) {
              setImgSrc(data.teams[0].strTeamBadge);
              setErrorLevel(2);
              return;
            }
          }
        } catch (e) {
          console.error('thesportsdb fetch error', e);
        }
        
        applyFallback(3);
      };
      
      fetchSportsDb();
      return;
    } 
    
    if (errorLevel === 2) {
       applyFallback(3);
       return;
    }

    setImgSrc(undefined);
    setErrorLevel(4);
  };

  if (!imgSrc || errorLevel >= 4) {
    return <span className={`flex items-center justify-center font-bold text-lg text-white ${className || ''}`}>{teamName?.charAt(0) || '?'}</span>;
  }

  return (
    <img 
      src={imgSrc} 
      alt={`شعار ${teamName}`} 
      loading="lazy"
      decoding="async"
      className={className} 
      onError={handleError} 
    />
  );
}
