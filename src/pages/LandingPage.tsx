import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { WebGLShader } from '../components/ui/web-gl-shader';
import { LiquidButton } from '../components/ui/liquid-glass-button';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-white/20">
      <div className="absolute inset-0 z-0 select-none overflow-hidden">
        <img
          src="/bg_hero_juara.png"
          alt="Landing Background"
          className="w-full h-full object-cover object-center scale-105 pointer-events-none"
          draggable={false}
          referrerPolicy="no-referrer"
        />
        {/* Soft dark overlay over the whole background so it's not overly bright, preserving the image */}
        <div className="absolute inset-0" />
      </div>

      <div className="relative z-10 px-4 w-full mx-auto max-w-4xl">

        {/* Changed bg-white/2 to bg-black/25 for a slight dark tint, improving text contrast without hiding the background */}
        <main className="relative border border-white/20 py-10 px-4 md:px-8 overflow-hidden bg-black/25 backdrop-blur rounded-[3rem] shadow-[0_8px_32px_rgba(0,0,0,0.3)] text-center">

          <div className="flex justify-center mb-8">
            <img src="/logo.png" alt="Logo" className="h-20 md:h-24 w-auto object-contain drop-shadow-lg" />
          </div>

          <h1
            className="mb-8 text-4xl md:text-5xl lg:text-6xl font-black tracking-tight select-none bg-clip-text text-transparent bg-gradient-to-b from-[#F9E5C9] to-white/60 drop-shadow-sm"
          >
            Manage deadlines and schedule.
          </h1>

          <div className="flex justify-center px-6 items-center">
            <LiquidButton
              className="text-white border border-white/30 bg-white/10 hover:bg-white/20 rounded-full w-48 transition-all shadow-lg backdrop-blur-sm"
              size={'xl'}
              onClick={() => navigate('/deadline')}
            >
              Get Started
            </LiquidButton>
          </div>
        </main>
      </div>
    </div>
  );
}
