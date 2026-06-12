import { Match } from '../types';

export function updateMatchSEO(match: Match | null) {
  if (!match) {
    // Restore default title and description
    document.title = "LiveFootball365 | بث مباشر كأس العالم 2026 - LiveFootball365 Live";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", "شاهد مباريات كأس العالم 2026 بث مباشر مجاني على LiveFootball365. جميع المباريات بجودة عالية بدون تقطع. Watch FIFA World Cup 2026 free live streaming.");
    }
    
    // Clear Match JSON-LD
    const matchSchema = document.getElementById('match-schema');
    if (matchSchema) {
      matchSchema.textContent = '';
    }
    return;
  }

  // Set dynamic title
  document.title = `${match.homeTeam.name} vs ${match.awayTeam.name} بث مباشر | LiveFootball365`;

  // Set dynamic description
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    const formattedDate = new Intl.DateTimeFormat('ar-EG', { dateStyle: 'full' }).format(new Date(match.date));
    metaDesc.setAttribute(
      "content", 
      `شاهد مباراة ${match.homeTeam.name} و ${match.awayTeam.name} بث مباشر مجاني على LiveFootball365. ${match.competition} - ${match.stadium || 'استاد'} - ${formattedDate}`
    );
  }

  // Inject JSON-LD SportsEvent schema
  let matchSchema = document.getElementById('match-schema');
  if (!matchSchema) {
    matchSchema = document.createElement('script');
    matchSchema.id = 'match-schema';
    matchSchema.setAttribute('type', 'application/ld+json');
    document.head.appendChild(matchSchema);
  }

  const schemaJSON = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    "name": `${match.homeTeam.name} vs ${match.awayTeam.name} - FIFA World Cup 2026`,
    "sport": "Soccer",
    "startDate": new Date(match.date).toISOString(),
    "location": {
      "@type": "Place",
      "name": match.stadium || 'Stadium'
    },
    "homeTeam": {
      "@type": "SportsTeam",
      "name": match.homeTeam.name
    },
    "awayTeam": {
      "@type": "SportsTeam",
      "name": match.awayTeam.name
    },
    "eventStatus": match.status === 'live' ? "https://schema.org/EventScheduled" : "https://schema.org/EventPostponed",
    "eventAttendanceMode": "https://schema.org/OnlineEventAttendanceMode",
    "url": "https://livefootball365.org",
    "organizer": {
      "@type": "Organization",
      "name": "FIFA",
      "url": "https://www.fifa.com"
    }
  };

  matchSchema.textContent = JSON.stringify(schemaJSON);
}

export function injectMatchListSchema(matches: Match[]) {
  if (!matches || matches.length === 0) return;

  let matchListSchema = document.getElementById('match-list-schema');
  if (!matchListSchema) {
    matchListSchema = document.createElement('script');
    matchListSchema.id = 'match-list-schema';
    matchListSchema.setAttribute('type', 'application/ld+json');
    document.head.appendChild(matchListSchema);
  }

  const schemaJSON = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "مباريات كأس العالم 2026 اليوم",
    "itemListElement": matches.map((m, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": `${m.homeTeam.name} vs ${m.awayTeam.name}`,
      "url": "https://livefootball365.org"
    }))
  };

  matchListSchema.textContent = JSON.stringify(schemaJSON);
}
