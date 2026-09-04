"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useScroll, useTransform, motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { ArrowRight } from "lucide-react";

const TOTAL_FRAMES = 239;
const LERP_FACTOR = 0.04;

export function ScrollyCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const [loadedCount, setLoadedCount] = useState(0);
  const [isReady, setIsReady] = useState(false);
  
  const imagesRef = useRef<(HTMLImageElement | null)[]>(new Array(TOTAL_FRAMES).fill(null));
  
  const { scrollYProgress: targetProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const stateRef = useRef({
    currentProgress: 0,
    targetProgress: 0,
    lastDrawnIndex: -1,
    rafId: 0,
    isActive: false
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setIsReducedMotion(mediaQuery.matches);
    const listener = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    mediaQuery.addEventListener("change", listener);
    
    const mobileQuery = window.matchMedia("(max-width: 768px)");
    setIsMobile(mobileQuery.matches);
    const mobileListener = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mobileQuery.addEventListener("change", mobileListener);

    return () => {
      mediaQuery.removeEventListener("change", listener);
      mobileQuery.removeEventListener("change", mobileListener);
    };
  }, []);

  useEffect(() => {
    let unmounted = false;
    let loaded = 0;
    
    const step = isMobile ? 2 : 1;
    const requiredFrames = Math.ceil(TOTAL_FRAMES / step);
    
    for (let i = 0; i < TOTAL_FRAMES; i += step) {
      const img = new Image();
      const frameNum = (i + 1).toString().padStart(6, '0');
      img.src = \/sequence/frame_\.webp\;
      
      img.onload = () => {
        if (unmounted) return;
        imagesRef.current[i] = img;
        loaded++;
        setLoadedCount(loaded);
        
        if (loaded >= requiredFrames) {
          setIsReady(true);
        }
      };
      
      img.onerror = () => {
        if (unmounted) return;
        loaded++;
        setLoadedCount(loaded);
        if (loaded >= requiredFrames) setIsReady(true);
      };
    }
    
    return () => { unmounted = true; };
  }, [isMobile]);

  useEffect(() => {
    if (!isReady) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      stateRef.current.lastDrawnIndex = -1;
    };
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    const drawFrame = (index: number) => {
      if (!ctx || !canvas) return;
      
      let imgIndex = index;
      if (imagesRef.current[imgIndex] === null) {
        let found = false;
        for (let i = index - 1; i >= 0; i--) {
          if (imagesRef.current[i] !== null) {
            imgIndex = i;
            found = true;
            break;
          }
        }
        if (!found) return;
      }

      const img = imagesRef.current[imgIndex];
      if (!img) return;

      const scale = Math.max(
        canvas.width / img.width,
        canvas.height / img.height
      );
      
      const drawW = img.width * scale;
      const drawH = img.height * scale;
      const x = (canvas.width - drawW) / 2;
      const y = (canvas.height - drawH) / 2;
      
      ctx.fillStyle = "#EAEAE8";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, x, y, drawW, drawH);
    };

    const unsubscribe = targetProgress.on("change", (latest) => {
      stateRef.current.targetProgress = latest;
      if (!stateRef.current.isActive) {
        stateRef.current.isActive = true;
        stateRef.current.rafId = requestAnimationFrame(renderLoop);
      }
    });

    const renderLoop = () => {
      const state = stateRef.current;
      
      state.currentProgress += (state.targetProgress - state.currentProgress) * LERP_FACTOR;
      
      if (Math.abs(state.targetProgress - state.currentProgress) < 0.0001) {
        state.currentProgress = state.targetProgress;
        state.isActive = false;
      }
      
      const frameIndex = Math.min(
        TOTAL_FRAMES - 1,
        Math.max(0, Math.floor(state.currentProgress * (TOTAL_FRAMES - 1)))
      );
      
      if (frameIndex !== state.lastDrawnIndex) {
        drawFrame(frameIndex);
        state.lastDrawnIndex = frameIndex;
      }
      
      if (state.isActive) {
        state.rafId = requestAnimationFrame(renderLoop);
      }
    };
    
    stateRef.current.isActive = true;
    stateRef.current.rafId = requestAnimationFrame(renderLoop);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      unsubscribe();
      cancelAnimationFrame(stateRef.current.rafId);
    };
  }, [isReady, targetProgress]);

  if (isReducedMotion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground text-center p-8">
        <div className="max-w-2xl">
          <h1 className="font-heading font-bold text-5xl md:text-7xl mb-6">Warden</h1>
          <p className="text-xl text-muted mb-8">Make your store sellable to AI buyers.</p>
          <Link href="/onboarding">
            <Button className="rounded-full">Get your readiness score</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className="relative w-full"
      style={{ height: isMobile ? "500vh" : "1000vh" }}
    >
      {!isReady && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background text-foreground">
          <div className="w-64 max-w-[80%]">
            <div className="flex justify-between mb-2 font-sans text-xs uppercase tracking-widest font-bold">
              <span>Loading sequence</span>
              <span>{Math.min(100, Math.round((loadedCount / (isMobile ? 30 : 60)) * 100))}%</span>
            </div>
            <div className="h-1 bg-black/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-black transition-all duration-300 ease-out"
                style={{ width: \\%\ }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="sticky top-0 h-screen w-full overflow-hidden bg-background">
        
        {/* Giant Background Text on top of canvas */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 overflow-hidden mix-blend-overlay">
          <h1 className="text-[28vw] font-heading font-bold text-black/10 tracking-tighter whitespace-nowrap select-none">
            warden.
          </h1>
        </div>
        
        <canvas 
          ref={canvasRef} 
          className="absolute inset-0 w-full h-full object-cover z-0"
          aria-hidden="true"
        />

        {/* TOP HEADER (Always Visible) */}
        <header className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-8 pointer-events-none">
          <div className="font-heading font-extrabold text-3xl tracking-tighter text-foreground pointer-events-auto">
            warden.
          </div>
          <nav className="hidden md:flex items-center gap-12 pointer-events-auto">
            <Link href="#how-it-works" className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground hover:opacity-70 transition-opacity">How it works</Link>
            <Link href="#science" className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground hover:opacity-70 transition-opacity">Infrastructure</Link>
            <Link href="#library" className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground hover:opacity-70 transition-opacity">Docs</Link>
          </nav>
          <div className="pointer-events-auto hidden md:block">
            <Button variant="outline" className="rounded-full">Get Started</Button>
          </div>
        </header>
        
        {/* OVERLAYS CONTAINER */}
        <div className="absolute inset-0 z-30 pointer-events-none p-6 md:p-12 pb-12 flex flex-col justify-end">
          <div className="flex flex-col md:flex-row justify-between items-end w-full h-full relative">
            
            {/* Left side text overlays (Absolute inside relative to overlap properly) */}
            <div className="relative w-full md:w-1/2 max-w-xl h-64 md:h-80 pointer-events-none flex flex-col justify-end">
              
              <OpacityBlock progress={targetProgress} start={0} end={0.15} className="absolute bottom-0 left-0 w-full">
                <div className="pointer-events-auto mb-6">
                  <Link href="#how-it-works">
                    <Button className="rounded-full bg-black text-white hover:bg-black/80 font-bold px-8">See how it works</Button>
                  </Link>
                </div>
                <h2 className="font-heading font-bold text-5xl md:text-7xl text-foreground tracking-tight mb-4 leading-[1.05]">
                  Make your store sellable to AI buyers
                </h2>
                <p className="text-muted text-lg max-w-md">
                  Warden uses AI to diagnose your infrastructure from a single scan — and builds an API layer that fits your exact stack.
                </p>
              </OpacityBlock>

              <OpacityBlock progress={targetProgress} start={0.15} end={0.35} className="absolute bottom-0 left-0 w-full">
                <h2 className="font-heading font-bold text-5xl md:text-7xl text-foreground tracking-tight mb-4 leading-[1.05]">
                  They move fast.<br/>They have no judgement.
                </h2>
                <p className="text-muted text-lg max-w-md">
                  Agentic buyers execute millions of transactions in milliseconds. They bypass your beautiful UI completely.
                </p>
              </OpacityBlock>

              <OpacityBlock progress={targetProgress} start={0.35} end={0.55} className="absolute bottom-0 left-0 w-full">
                <h2 className="font-heading font-bold text-5xl md:text-7xl text-foreground tracking-tight mb-4 leading-[1.05]">
                  Every purchase hits the gate.
                </h2>
                <p className="text-muted text-lg max-w-md">
                  Block unsafe velocity. Limit categories. Reject bad payloads. Instantly.
                </p>
              </OpacityBlock>

              <OpacityBlock progress={targetProgress} start={0.55} end={0.75} className="absolute bottom-0 left-0 w-full">
                <h2 className="font-heading font-bold text-5xl md:text-7xl text-foreground tracking-tight mb-4 leading-[1.05]">
                  Approved. Explained. Logged.
                </h2>
                <p className="text-muted text-lg max-w-md">
                  Nothing moves without a reason. Audit trails built directly into the execution layer.
                </p>
              </OpacityBlock>

              <OpacityBlock progress={targetProgress} start={0.75} end={1.0} className="absolute bottom-0 left-0 w-full">
                <h2 className="font-heading font-bold text-5xl md:text-7xl text-foreground tracking-tight mb-4 leading-[1.05]">
                  Ready for the autonomous web.
                </h2>
                <p className="text-muted text-lg max-w-md mb-8">
                  Future-proof your revenue streams before the market shifts entirely to agent-led procurement.
                </p>
                <div className="pointer-events-auto">
                  <Link href="/onboarding">
                    <Button size="lg" className="rounded-full bg-black text-white hover:bg-black/80 font-bold px-10">Get your readiness score</Button>
                  </Link>
                </div>
              </OpacityBlock>

            </div>

            {/* Right side static cards */}
            <div className="hidden md:flex gap-6 pointer-events-auto h-64 md:h-80 items-end">
              <div className="bg-white rounded-[2rem] p-8 w-[17rem] shadow-sm flex flex-col justify-between aspect-square">
                <div className="font-heading font-bold text-6xl tracking-tight text-foreground">92%</div>
                <div className="flex justify-between items-end mt-4 gap-4">
                  <div className="text-[10px] leading-relaxed text-muted font-bold uppercase tracking-widest w-full">of autonomous checkouts succeed on first try</div>
                  <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center shrink-0 cursor-pointer hover:bg-black/80 transition-colors">
                    <ArrowRight className="w-5 h-5 -rotate-45" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-[2rem] p-8 w-[17rem] shadow-sm flex flex-col justify-between aspect-square">
                <div className="font-heading font-bold text-6xl tracking-tight text-foreground flex items-baseline">100<span className="text-3xl ml-1">ms</span></div>
                <div className="flex justify-between items-end mt-4 gap-4">
                  <div className="text-[10px] leading-relaxed text-muted font-bold uppercase tracking-widest w-full">average api transaction velocity for ai agents</div>
                  <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center shrink-0 cursor-pointer hover:bg-black/80 transition-colors">
                    <ArrowRight className="w-5 h-5 -rotate-45" />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

function OpacityBlock({ progress, start, end, children, className }: any) {
  const opacity = useTransform(progress, (v: number) => {
    const range = end - start;
    const fade = range * 0.15;
    
    if (v < start) return 0;
    if (v > end) return 0;
    
    if (v < start + fade) return (v - start) / fade;
    if (v > end - fade) return (end - v) / fade;
    
    return 1;
  });

  const zIndex = useTransform(opacity, (v) => (v > 0 ? 10 : 0));

  return (
    <motion.div style={{ opacity, zIndex }} className={className}>
      {children}
    </motion.div>
  );
}
