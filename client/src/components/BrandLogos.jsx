import React from 'react';

// Crisp, institutional SVG brand marks for authentic Indian commerce leaders

export function LogoSwiggy({ className = "h-6 w-auto" }) {
  return (
    <div className={`inline-flex items-center space-x-2 ${className}`}>
      <svg viewBox="0 0 28 28" fill="none" className="h-6 w-6 flex-shrink-0">
        <rect width="28" height="28" rx="7" fill="#FC8019" />
        <path
          d="M14 6C10.686 6 8 8.686 8 12c0 4.5 6 10 6 10s6-5.5 6-10c0-3.314-2.686-6-6-6zm0 8.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"
          fill="white"
        />
      </svg>
      <span className="font-bold text-[#0f172a] text-sm tracking-tight">Swiggy</span>
    </div>
  );
}

export function LogoNykaa({ className = "h-6 w-auto" }) {
  return (
    <div className={`inline-flex items-center space-x-1.5 ${className}`}>
      <span className="font-extrabold italic text-[#E80071] text-base tracking-wider font-sans">
        NYKAA
      </span>
    </div>
  );
}

export function LogoBookMyShow({ className = "h-6 w-auto" }) {
  return (
    <div className={`inline-flex items-center space-x-1.5 ${className}`}>
      <div className="h-5 w-5 rounded-md bg-[#EC1D24] text-white flex items-center justify-center font-black text-[10px]">
        B
      </div>
      <span className="font-bold text-[#0f172a] text-sm tracking-tight">
        book<span className="text-[#EC1D24]">my</span>show
      </span>
    </div>
  );
}

export function LogoBoat({ className = "h-6 w-auto" }) {
  return (
    <div className={`inline-flex items-center space-x-1.5 ${className}`}>
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-[#E62E2D] flex-shrink-0">
        <path d="M12 2L4 16H20L12 2Z" fill="currentColor" />
        <path d="M4 18L12 22L20 18H4Z" fill="#0f172a" />
      </svg>
      <span className="font-black text-[#0f172a] text-sm tracking-tight">
        bo<span className="text-[#E62E2D]">A</span>t
      </span>
    </div>
  );
}

export function LogoLenskart({ className = "h-6 w-auto" }) {
  return (
    <div className={`inline-flex items-center space-x-1.5 ${className}`}>
      <svg viewBox="0 0 32 18" fill="none" className="h-4 w-7 text-[#000042] flex-shrink-0">
        <circle cx="7" cy="9" r="6" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="25" cy="9" r="6" stroke="currentColor" strokeWidth="2.5" />
        <path d="M13 9H19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <span className="font-bold text-[#000042] text-sm tracking-tight">lenskart</span>
    </div>
  );
}

export function LogoMamaearth({ className = "h-6 w-auto" }) {
  return (
    <div className={`inline-flex items-center space-x-1.5 ${className}`}>
      <div className="w-5 h-5 rounded-full bg-[#3FB55E] flex items-center justify-center text-white text-[10px] font-bold">
        m
      </div>
      <span className="font-bold text-[#3FB55E] text-sm tracking-tight">mamaearth</span>
    </div>
  );
}

export function LogoSubko({ className = "h-6 w-auto" }) {
  return (
    <div className={`inline-flex items-center space-x-1.5 ${className}`}>
      <div className="h-5 w-5 rounded-sm bg-[#1E1E1E] text-white flex items-center justify-center font-serif text-[10px] font-bold">
        S
      </div>
      <span className="font-mono font-bold text-[#1E1E1E] text-xs tracking-widest uppercase">
        SUBKO COFFEE
      </span>
    </div>
  );
}

export function LogoBlueTokai({ className = "h-6 w-auto" }) {
  return (
    <div className={`inline-flex items-center space-x-1.5 ${className}`}>
      <div className="h-5 w-5 rounded-full bg-[#004B87] text-white flex items-center justify-center text-[10px] font-bold">
        BT
      </div>
      <span className="font-serif font-bold text-[#004B87] text-xs tracking-wider">
        BLUE TOKAI
      </span>
    </div>
  );
}

export function LogoSnitch({ className = "h-6 w-auto" }) {
  return (
    <div className={`inline-flex items-center space-x-1.5 ${className}`}>
      <span className="font-mono font-extrabold text-[#0f172a] text-sm tracking-widest uppercase">
        SNITCH
      </span>
    </div>
  );
}

export function LogoDailyObjects({ className = "h-6 w-auto" }) {
  return (
    <div className={`inline-flex items-center space-x-1.5 ${className}`}>
      <div className="h-5 w-5 rounded-md bg-[#FF5C39] text-white flex items-center justify-center text-[10px] font-bold">
        DO
      </div>
      <span className="font-sans font-bold text-[#0f172a] text-xs tracking-tight">
        DailyObjects
      </span>
    </div>
  );
}
