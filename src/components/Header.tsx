import { Globe, Moon, Sun } from 'lucide-react';

export default function Header({ 
  liveCount, 
  lang, 
  toggleLang,
  theme,
  toggleTheme
}: { 
  liveCount?: number;
  lang: string;
  toggleLang: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}) {
  return (
    <header role="banner" className={`h-[60px] flex items-center justify-between px-4 shadow-md relative z-50 shrink-0 transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0f0f13] border-b border-white/10' : 'bg-gradient-to-r from-[#4B0082] via-[#6A0DAD] to-[#4B0082]'}`}>
      {/* Right side (First element in RTL) -> Language Toggle */}
      <button 
        onClick={toggleLang}
        className="flex items-center justify-center w-10 h-10 text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors font-bold text-sm border border-white/10 backdrop-blur-sm shadow-sm"
        title={lang === 'en' ? 'Arabic' : 'English'}
      >
         <Globe className="w-5 h-5" />
      </button>

      <h1 className="text-white font-heading font-black text-2xl tracking-[0.1em] uppercase drop-shadow-md">
        <a href="/" aria-label="ماتشورا - الصفحة الرئيسية">LIVEFOOTBALL365</a>
      </h1>
      
      {/* Left side (Last element in RTL) -> Dark Mode Toggle */}
      <button 
        onClick={toggleTheme}
        className="flex items-center justify-center w-10 h-10 text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors border border-white/10 backdrop-blur-sm shadow-sm"
      >
        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>
    </header>
  );
}
