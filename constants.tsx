
import React from 'react';

export const COLORS = {
  carrot: '#ff8a3d',
  carrotHover: '#e67a2e',
};

export const INITIAL_BALANCE = 10000;
export const CLEANING_COST_RATIO = 0.1; // 10% of base price to clean
export const ROT_TIME_MS = 30 * 60 * 1000; // 30 minutes

export const CarrotLogo = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8 fill-current text-[#ff8a3d]" xmlns="http://www.w3.org/2000/svg">
    <path d="M21.72 9.07a1 1 0 00-.81-.68l-4.14-.6a1 1 0 01-.75-.55l-1.85-3.75a1 1 0 00-1.79 0l-1.85 3.75a1 1 0 01-.75.55l-4.14.6a1 1 0 00-.55 1.7l3 2.92a1 1 0 01.29.89l-.71 4.12a1 1 0 001.45 1.05L12 16.9a1 1 0 01.93 0l3.71 1.95a1 1 0 001.45-1.05l-.71-4.12a1 1 0 01.29-.89l3-2.92a1 1 0 00.25-.8z" />
  </svg>
);
