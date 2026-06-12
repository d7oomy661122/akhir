import { useEffect, useState } from 'react';
import { differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds, parseISO } from 'date-fns';

export default function CountdownHero({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const target = parseISO(targetDate);
    const interval = setInterval(() => {
      const now = new Date();
      setTimeLeft({
        days: Math.max(0, differenceInDays(target, now)),
        hours: Math.max(0, differenceInHours(target, now) % 24),
        minutes: Math.max(0, differenceInMinutes(target, now) % 60),
        seconds: Math.max(0, differenceInSeconds(target, now) % 60),
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0) {
    return null;
  }

  return (
    <div className="shrink-0 bg-[#1a1a24] border border-[#2a2a3a] rounded-xl p-6 lg:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
      
      <div className="relative z-10 text-center md:text-right">
        <h2 className="text-xl font-black text-white mb-2">البث المباشر · كأس العالم 2026 🏆</h2>
        <p className="text-sm text-[#a1a1aa]">تغطية حصرية لجميع مباريات البطولة لحظة بلحظة</p>
      </div>

      <div className="relative z-10 flex items-center gap-3 text-center" dir="ltr">
        {[
          { label: 'أيام', value: timeLeft.days },
          { label: 'ساعات', value: timeLeft.hours },
          { label: 'دقائق', value: timeLeft.minutes },
          { label: 'ثواني', value: timeLeft.seconds },
        ].map((item, id, arr) => (
          <div key={id} className="flex items-center gap-3">
            <div className="flex flex-col items-center">
              <div className="bg-[#0f0f13] border border-[#2a2a3a] w-14 h-16 flex items-center justify-center rounded-lg text-2xl font-mono font-bold text-white mb-2">
                {item.value.toString().padStart(2, '0')}
              </div>
              <span className="text-[10px] uppercase text-[#52525b] font-medium tracking-wide">{item.label}</span>
            </div>
            {id < arr.length - 1 && (
              <div className="text-xl font-bold text-[#52525b] mb-6">:</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
