"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useScroll, useTransform, motion } from "framer-motion";

const TOTAL_FRAMES = 239;
const LERP_FACTOR = 0.04;

// To avoid excessive re-renders, text blocks just use useTransform internally
// We define standard fade thresholds for text
export function ScrollyCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const [loadedCount, setLoadedCount] = useState(0);
  const [isReady, setIsReady] = useState(false);
  
  // Track images in a ref so they don't trigger re-renders
  const imagesRef = useRef<(HTMLImageElement | null)[]>(new Array(TOTAL_FRAMES).fill(null));
  
  // We need current progress separate from target progress for LERP
  // Framer motion's useScroll gives us target
  const { scrollYProgress: targetProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Track state for the animation loop
  const stateRef = useRef({
    currentProgress: 0,
    targetProgress: 0,
    lastDrawnIndex: -1,
    rafId: 0,
    isActive: false
  });

  // Check prefers-reduced-motion & mobile on mount
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

  // Preload logic
  useEffect(() => {
    if (isReducedMotion) {
      setIsReady(true); // Don't block
      return;
    }

    const INITIAL_BATCH = isMobile ? 30 : 60;
    
    // Load a single frame
    const loadFrame = (index: number): Promise<void> => {
      return new Promise((resolve) => {
        if (imagesRef.current[index]) return resolve(); // Already loaded
        
        const img = new Image();
        // 1-indexed, zero-padded
        const num = String(index + 1).padStart(6, '0');
        img.src = `/sequence/frame_${num}.webp`;
        img.onload = () => {
          imagesRef.current[index] = img;
          setLoadedCount(prev => prev + 1);
          resolve();
        };
        img.onerror = () => {
          // If a frame fails, just resolve so we don't block forever
          resolve();
        };
      });
    };

    // Load first batch
    const loadInitialBatch = async () => {
      const promises = [];
      for (let i = 0; i < INITIAL_BATCH; i++) {
        promises.push(loadFrame(i));
      }
      await Promise.all(promises);
      setIsReady(true);
      
      // Then load rest in batches of 20
      const loadRemaining = async () => {
        for (let i = INITIAL_BATCH; i < TOTAL_FRAMES; i += 20) {
          const batch = [];
          for (let j = i; j < Math.min(i + 20, TOTAL_FRAMES); j++) {
            batch.push(loadFrame(j));
          }
          await Promise.all(batch);
        }
      };
      
      loadRemaining();
    };
    
    loadInitialBatch();
  }, [isReducedMotion, isMobile]);

  // Framer-motion scroll subscription to trigger RAF
  useEffect(() => {
    if (isReducedMotion) return;
    
    const unsubscribe = targetProgress.on("change", (latest) => {
      stateRef.current.targetProgress = latest;
      
      if (!stateRef.current.isActive) {
        stateRef.current.isActive = true;
        stateRef.current.rafId = requestAnimationFrame(renderLoop);
      }
    });
    
    return () => unsubscribe();
  }, [targetProgress, isReducedMotion]);

  // The actual render loop
  const renderLoop = () => {
    const state = stateRef.current;
    
    // LERP
    state.currentProgress += (state.targetProgress - state.currentProgress) * LERP_FACTOR;
    
    // Check if we converged
    if (Math.abs(state.targetProgress - state.currentProgress) < 0.0001) {
      state.currentProgress = state.targetProgress;
      state.isActive = false; // Stop RAF
    } else {
      state.rafId = requestAnimationFrame(renderLoop);
    }
    
    drawFrame(state.currentProgress);
  };

  // Draw logic
  const drawFrame = (progress: number) => {
    if (!canvasRef.current) return;
    
    // Math.min(238, floor(progress * 239))
    let frameIndex = Math.min(TOTAL_FRAMES - 1, Math.floor(progress * TOTAL_FRAMES));
    
    // Fallback if not loaded
    while (frameIndex >= 0 && !imagesRef.current[frameIndex]) {
      frameIndex--;
    }
    
    if (frameIndex < 0) return; // Nothing loaded at all
    
    // Redraw guard
    if (frameIndex === stateRef.current.lastDrawnIndex) return;
    stateRef.current.lastDrawnIndex = frameIndex;
    
    const ctx = canvasRef.current.getContext("2d", { alpha: false });
    if (!ctx) return;
    
    const img = imagesRef.current[frameIndex];
    if (!img) return;
    
    const canvas = canvasRef.current;
    
    // Ensure canvas dimensions match CSS pixels for crisp rendering
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }
    
    // Object-fit: cover logic
    const canvasRatio = canvas.width / canvas.height;
    const imgRatio = img.width / img.height;
    
    let drawWidth = canvas.width;
    let drawHeight = canvas.height;
    let offsetX = 0;
    let offsetY = 0;
    
    if (canvasRatio > imgRatio) {
      // Canvas is wider than image
      drawHeight = canvas.width / imgRatio;
      offsetY = (canvas.height - drawHeight) / 2;
    } else {
      // Canvas is taller than image
      drawWidth = canvas.height * imgRatio;
      offsetX = (canvas.width - drawWidth) / 2;
    }
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
  };

  // Initial draw once ready
  useEffect(() => {
    if (isReady && canvasRef.current && !isReducedMotion) {
      drawFrame(stateRef.current.currentProgress);
    }
  }, [isReady, isReducedMotion]);

  // Reduced motion fallback
  if (isReducedMotion) {
    return (
      <div className="relative min-h-screen bg-[#D7E2EA] text-[#17242F] overflow-hidden">
        {/* Static Background */}
        <div 
          className="absolute inset-0 z-0 opacity-40 bg-cover bg-center"
          style={{ backgroundImage: `url('/sequence/frame_000239.webp')` }}
        />
        
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-20 text-center gap-12 max-w-4xl mx-auto">
          <h1 className="font-serif text-5xl md:text-7xl">
            An AI agent wants to buy something.
          </h1>
          
          <div className="space-y-4">
            <h2 className="font-serif text-3xl md:text-5xl">It moves fast. It has no judgement.</h2>
            <p className="text-muted text-lg">But every purchase hits <span className="font-bold text-[#C9E44C] px-1 bg-[#17242F] rounded">the gate</span>.</p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 text-xl">
            <span className="px-4 py-2 bg-white/50 backdrop-blur rounded-full">Amount</span>
            <span className="px-4 py-2 bg-white/50 backdrop-blur rounded-full">Category</span>
            <span className="px-4 py-2 bg-white/50 backdrop-blur rounded-full">Daily limit</span>
            <span className="px-4 py-2 bg-white/50 backdrop-blur rounded-full">Velocity</span>
          </div>
          
          <h2 className="font-serif text-4xl md:text-6xl">
            Approved. <span className="text-[#C9E44C] bg-[#17242F] px-2 rounded">Explained.</span> Logged.
          </h2>
          
          <div className="pt-12">
            <h2 className="font-serif text-4xl md:text-6xl mb-8">
              Every AI purchase, explained, bounded, and logged.
            </h2>
            <Link href="/onboarding" className="inline-block px-8 py-4 bg-[#C9E44C] text-[#17242F] font-bold rounded-full hover:scale-105 active:scale-95 transition-all">
              Get your readiness score
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Fade helper for standard opacity curve (fade in over 15% of its range, out over 15%)
  // Opacity blocks don't need createOpacityRange anymore because we use a function inside OpacityBlock.
  // We just pass start and end as props.
  return (
    <div 
      ref={containerRef} 
      className="relative w-full"
      style={{ height: isMobile ? "500vh" : "1000vh" }}
    >
      {/* Loading Screen Overlay */}
      {!isReady && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#D7E2EA] text-[#17242F]">
          <div className="w-64 max-w-[80%]">
            <div className="flex justify-between mb-2 font-sans text-sm">
              <span>Loading Sequence...</span>
              <span>{Math.min(100, Math.round((loadedCount / (isMobile ? 30 : 60)) * 100))}%</span>
            </div>
            <div className="h-1 bg-[#17242F]/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#C9E44C] transition-all duration-300 ease-out"
                style={{ width: `${Math.min(100, Math.round((loadedCount / (isMobile ? 30 : 60)) * 100))}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Sticky Container for Canvas & Overlays */}
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-[#D7E2EA]">
        
        {/* The Canvas */}
        <canvas 
          ref={canvasRef} 
          className="absolute inset-0 w-full h-full object-cover z-0"
          aria-hidden="true"
        />
        
        {/* Overlays Container */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center p-4 pointer-events-none">
          
          {/* Block 1 */}
          <OpacityBlock 
            progress={targetProgress} 
            start={0} end={0.12}
            className="absolute max-w-2xl"
          >
            <h2 className="font-serif text-5xl md:text-7xl text-white drop-shadow-lg">
              An AI agent wants to buy something.
            </h2>
          </OpacityBlock>

          {/* Block 2 */}
          <OpacityBlock 
            progress={targetProgress} 
            start={0.12} end={0.30}
            className="absolute max-w-2xl"
          >
            <h2 className="font-serif text-4xl md:text-6xl text-white drop-shadow-lg mb-2">
              It moves fast.
            </h2>
            <h2 className="font-serif text-4xl md:text-6xl text-white drop-shadow-lg">
              It has no judgement.
            </h2>
          </OpacityBlock>

          {/* Block 3 */}
          <OpacityBlock 
            progress={targetProgress} 
            start={0.30} end={0.45}
            className="absolute max-w-2xl"
          >
            <h2 className="font-serif text-5xl md:text-7xl text-white drop-shadow-lg">
              Every purchase hits <span className="text-[#C9E44C] bg-[#17242F] px-2 rounded inline-block mt-2">the gate</span>.
            </h2>
          </OpacityBlock>

          {/* Block 4 (Checklist) */}
          <OpacityBlock 
            progress={targetProgress} 
            start={0.45} end={0.62}
            className="absolute max-w-2xl"
          >
            <div className="flex flex-col gap-4 font-sans text-3xl md:text-5xl font-bold text-white drop-shadow-lg">
              <ChecklistWord progress={targetProgress} start={0.45} end={0.62} idx={0}>Amount.</ChecklistWord>
              <ChecklistWord progress={targetProgress} start={0.45} end={0.62} idx={1}>Category.</ChecklistWord>
              <ChecklistWord progress={targetProgress} start={0.45} end={0.62} idx={2}>Daily limit.</ChecklistWord>
              <ChecklistWord progress={targetProgress} start={0.45} end={0.62} idx={3}>Velocity.</ChecklistWord>
            </div>
          </OpacityBlock>

          {/* Block 5 */}
          <OpacityBlock 
            progress={targetProgress} 
            start={0.62} end={0.78}
            className="absolute max-w-2xl"
          >
            <h2 className="font-serif text-5xl md:text-7xl text-white drop-shadow-lg leading-tight">
              Approved.<br/>
              <span className="text-[#C9E44C] bg-[#17242F] px-2 rounded mx-2">Explained.</span><br/>
              Logged.
            </h2>
          </OpacityBlock>

          {/* Block 6 */}
          <OpacityBlock 
            progress={targetProgress} 
            start={0.78} end={0.92}
            className="absolute max-w-2xl"
          >
            <h2 className="font-serif text-4xl md:text-6xl text-white drop-shadow-lg">
              Nothing moves without a reason.
            </h2>
          </OpacityBlock>

          {/* Block 7 (Closing) */}
          <OpacityBlock 
            progress={targetProgress} 
            start={0.92} end={1.0}
            className="absolute max-w-4xl"
          >
            <h2 className="font-serif text-5xl md:text-7xl text-white drop-shadow-lg mb-8">
              Every AI purchase, explained, bounded, and logged.
            </h2>
            <div className="pointer-events-auto">
              <Link href="/onboarding" className="inline-block px-8 py-4 bg-[#C9E44C] text-[#17242F] font-bold text-xl rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg">
                Get your readiness score
              </Link>
            </div>
          </OpacityBlock>

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
    
    if (v < start + fade) {
      // fading in
      return (v - start) / fade;
    }
    if (v > end - fade) {
      // fading out
      return (end - v) / fade;
    }
    
    return 1;
  });

  return (
    <motion.div style={{ opacity }} className={className}>
      {children}
    </motion.div>
  );
}

function ChecklistWord({ progress, start, end, idx, children }: any) {
  const opacity = useTransform(progress, (v: number) => {
    const step = (end - start) / 4;
    const wordStart = start + step * idx;
    const peak = wordStart + step * 0.5;
    const fall = end - 0.02;
    
    if (v < wordStart) return 0;
    if (v > end) return 0;
    
    if (v < peak) {
      // fade in
      return (v - wordStart) / (peak - wordStart);
    }
    
    if (v > fall) {
      // fade out
      return (end - v) / (end - fall);
    }
    
    return 1;
  });
  
  return (
    <motion.div style={{ opacity }}>
      {children}
    </motion.div>
  );
}
