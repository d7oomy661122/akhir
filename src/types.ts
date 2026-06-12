/// <reference types="vite/client" />
export type StreamType = 'm3u8' | 'mpd' | 'mp4' | 'youtube' | 'iframe' | 'facebook' | 'auto';

export interface Stream {
  id: string;
  name: string;
  type: StreamType;
  url: string;
}

export interface Team {
  id?: string;
  name: string;
  flag: string;
  score: number | null;
}

export interface Match {
  id: string;
  status: 'upcoming' | 'live' | 'finished';
  matchTime: string | null;
  date: string;
  stadium: string;
  homeTeam: Team;
  awayTeam: Team;
  streams: Stream[];
  crestHome?: string;
  crestAway?: string;
  competition?: string;
  broadcasters?: string[];
}
