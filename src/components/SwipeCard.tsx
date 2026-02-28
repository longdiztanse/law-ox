"use client";

import {
  useRef,
  useCallback,
  useEffect,
  type MouseEvent,
} from "react";

interface SwipeCardProps {
  statement: string;
  cardType: string;
  subject: string;
  index: number;
  total: number;
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
  onConfusing: () => void;
  stackPosition?: number;
  dragProgress?: number;
  onDragProgress?: (progress: number) => void;
}

const SWIPE_THRESHOLD = 80;
const VELOCITY_THRESHOLD = 0.6;
const ROTATION_MULTIPLIER = 0.15;
const Y_DAMPING = 0.4;
const SPRING_TENSION = 0.3;
const SPRING_FRICTION = 0.75;
const STACK_SCALE_STEP = 0.05;
const STACK_Y_STEP = 12;

const subjectLabel: Record<string, string> = { civil: "민법", criminal: "형법", public: "공법", mixed: "혼합" };
const cardTypeLabel: Record<string, string> = { REQ: "요건", EFF: "효과", EXC: "예외", BUR: "증명책임", CMP: "비교", GEN: "일반" };

export default function SwipeCard({
  statement,
  cardType,
  subject,
  index,
  total,
  onSwipeRight,
  onSwipeLeft,
  onConfusing,
  stackPosition = 0,
  dragProgress = 0,
  onDragProgress,
}: SwipeCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const animFrameRef = useRef<number>(0);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const currentOffsetRef = useRef({ x: 0, y: 0 });
  const isExitingRef = useRef(false);
  const isAnimatingRef = useRef(false);

  const velocityRef = useRef({
    history: [] as Array<{ x: number; y: number; t: number }>,
    touchOffsetY: 0,
  });

  const springRef = useRef({ x: 0, y: 0, vx: 0, vy: 0 });

  const callbacksRef = useRef({ onSwipeRight, onSwipeLeft, onConfusing, onDragProgress });
  callbacksRef.current = { onSwipeRight, onSwipeLeft, onConfusing, onDragProgress };

  // Direct DOM manipulation helpers — no React state, no re-renders
  const setCardTransform = useCallback((x: number, y: number, scale: number, opacity?: number) => {
    if (!cardRef.current) return;
    const rot = x * ROTATION_MULTIPLIER;
    cardRef.current.style.transition = "none";
    cardRef.current.style.transform = `translateX(${x}px) translateY(${y}px) rotate(${rot}deg) scale(${scale})`;
    if (opacity !== undefined) {
      cardRef.current.style.opacity = String(opacity);
    }
  }, []);

  const setCardShadow = useCallback((dragging: boolean, progress: number) => {
    if (!innerRef.current) return;
    if (dragging) {
      innerRef.current.style.boxShadow = `0 20px 60px rgba(0,0,0,${0.08 + progress * 0.15}), 0 8px 20px rgba(0,0,0,0.06)`;
      innerRef.current.style.border = progress > 0.3 ? `2px solid rgba(0,0,0,${progress * 0.3})` : "2px solid transparent";
    } else {
      innerRef.current.style.boxShadow = "0 4px 24px rgba(0,0,0,0.06)";
      innerRef.current.style.border = "2px solid transparent";
    }
  }, []);

  const updateIndicators = useCallback((ox: number, oy: number, progress: number) => {
    if (!cardRef.current) return;
    const oEl = cardRef.current.querySelector("[data-indicator='O']") as HTMLElement;
    const xEl = cardRef.current.querySelector("[data-indicator='X']") as HTMLElement;
    const qEl = cardRef.current.querySelector("[data-indicator='?']") as HTMLElement;
    const isUp = oy < -30 && Math.abs(oy) > Math.abs(ox);
    if (oEl) oEl.style.display = !isUp && ox > 30 ? "flex" : "none";
    if (xEl) xEl.style.display = !isUp && ox < -30 ? "flex" : "none";
    if (qEl) qEl.style.display = isUp ? "flex" : "none";
    if (oEl && ox > 30) oEl.style.borderColor = `rgba(0,0,0,${0.2 + progress * 0.6})`;
    if (xEl && ox < -30) xEl.style.borderColor = `rgba(0,0,0,${0.2 + progress * 0.6})`;
    if (qEl && isUp) qEl.style.borderColor = `rgba(0,0,0,${0.2 + progress * 0.6})`;
  }, []);

  const computeVelocity = useCallback(() => {
    const hist = velocityRef.current.history;
    if (hist.length < 2) return { vx: 0, vy: 0 };
    const last = hist[hist.length - 1];
    const prev = hist.find(h => last.t - h.t > 40) || hist[0];
    const dt = last.t - prev.t;
    if (dt === 0) return { vx: 0, vy: 0 };
    return {
      vx: (last.x - prev.x) / dt,
      vy: (last.y - prev.y) / dt,
    };
  }, []);

  const resetCard = useCallback(() => {
    if (!cardRef.current) return;
    isAnimatingRef.current = false;
    cardRef.current.style.transition = "";
    cardRef.current.style.transform = "";
    cardRef.current.style.opacity = "";
    setCardShadow(false, 0);
    updateIndicators(0, 0, 0);
    callbacksRef.current.onDragProgress?.(0);
  }, [setCardShadow, updateIndicators]);

  const animateSpringBack = useCallback(() => {
    isAnimatingRef.current = true;
    const spring = springRef.current;

    function step() {
      const ax = -SPRING_TENSION * spring.x - SPRING_FRICTION * spring.vx;
      const ay = -SPRING_TENSION * spring.y - SPRING_FRICTION * spring.vy;
      spring.vx += ax;
      spring.vy += ay;
      spring.x += spring.vx;
      spring.y += spring.vy;

      setCardTransform(spring.x, spring.y, 1);
      updateIndicators(spring.x, spring.y, Math.min(Math.abs(spring.x) / SWIPE_THRESHOLD, 1));

      const progress = Math.min(Math.abs(spring.x) / SWIPE_THRESHOLD, 1);
      callbacksRef.current.onDragProgress?.(progress);

      if (Math.abs(spring.x) < 0.5 && Math.abs(spring.y) < 0.5 &&
          Math.abs(spring.vx) < 0.1 && Math.abs(spring.vy) < 0.1) {
        spring.x = 0; spring.y = 0; spring.vx = 0; spring.vy = 0;
        resetCard();
        return;
      }

      animFrameRef.current = requestAnimationFrame(step);
    }

    step();
  }, [setCardTransform, updateIndicators, resetCard]);

  const animateExit = useCallback((direction: "left" | "right" | "up", velocity: { vx: number; vy: number }) => {
    isAnimatingRef.current = true;
    const spring = springRef.current;
    spring.x = currentOffsetRef.current.x;
    spring.y = currentOffsetRef.current.y;

    if (direction === "up") {
      const minVy = 1.8;
      spring.vx = velocity.vx * 16;
      spring.vy = (Math.abs(velocity.vy) > minVy ? velocity.vy : -minVy) * 16;
    } else {
      const minVx = 1.8;
      const exitVx = Math.abs(velocity.vx) > minVx
        ? velocity.vx
        : (direction === "right" ? minVx : -minVx);
      spring.vx = exitVx * 16;
      spring.vy = velocity.vy * 16;
    }

    callbacksRef.current.onDragProgress?.(1);

    function step() {
      spring.vx *= 0.98;
      spring.vy *= 0.98;
      spring.x += spring.vx;
      spring.y += spring.vy;

      const dist = direction === "up" ? Math.abs(spring.y) : Math.abs(spring.x);
      const opacity = Math.max(1 - dist / 400, 0);
      setCardTransform(spring.x, spring.y, 1 - dist * 0.0003, opacity);

      if (dist > 500 || opacity <= 0) {
        cancelAnimationFrame(animFrameRef.current);
        if (direction === "right") callbacksRef.current.onSwipeRight();
        else if (direction === "left") callbacksRef.current.onSwipeLeft();
        else callbacksRef.current.onConfusing();
        return;
      }

      animFrameRef.current = requestAnimationFrame(step);
    }

    step();
  }, [setCardTransform]);

  const handleStart = useCallback((clientX: number, clientY: number) => {
    if (isExitingRef.current || isAnimatingRef.current) return;
    cancelAnimationFrame(animFrameRef.current);
    isDraggingRef.current = true;
    startXRef.current = clientX;
    startYRef.current = clientY;
    currentOffsetRef.current = { x: 0, y: 0 };
    velocityRef.current.history = [];

    if (cardRef.current) {
      cardRef.current.style.transition = "none";
    }
  }, []);

  const handleMoveRaw = useCallback((clientX: number, clientY: number) => {
    if (!isDraggingRef.current) return;
    const ox = clientX - startXRef.current;
    const oy = (clientY - startYRef.current) * Y_DAMPING;
    currentOffsetRef.current = { x: ox, y: oy };

    const rawOy = oy / Y_DAMPING;
    const progress = Math.min(Math.max(Math.abs(ox), Math.abs(rawOy)) / SWIPE_THRESHOLD, 1);
    setCardTransform(ox, oy - 6, 1.02);
    setCardShadow(true, progress);
    updateIndicators(ox, oy - 6, progress);

    const now = performance.now();
    const hist = velocityRef.current.history;
    hist.push({ x: clientX, y: clientY, t: now });
    if (hist.length > 6) hist.shift();

    callbacksRef.current.onDragProgress?.(progress);
  }, [setCardTransform, setCardShadow, updateIndicators]);

  const handleEnd = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    const velocity = computeVelocity();
    const ox = currentOffsetRef.current.x;
    const oy = currentOffsetRef.current.y;
    const rawOy = oy / Y_DAMPING; // undo damping for threshold check
    const isFlickX = Math.abs(velocity.vx) > VELOCITY_THRESHOLD;
    const isFlickUp = velocity.vy < -VELOCITY_THRESHOLD;
    const isPastThresholdX = Math.abs(ox) > SWIPE_THRESHOLD;
    const isPastThresholdUp = rawOy < -SWIPE_THRESHOLD;

    setCardShadow(false, 0);

    // Up swipe takes priority if vertical movement dominates
    if ((isFlickUp || isPastThresholdUp) && Math.abs(rawOy) > Math.abs(ox)) {
      isExitingRef.current = true;
      animateExit("up", velocity);
    } else if (isFlickX || isPastThresholdX) {
      const exitDir = isFlickX
        ? (velocity.vx > 0 ? "right" : "left") as "right" | "left"
        : (ox > 0 ? "right" : "left") as "right" | "left";
      isExitingRef.current = true;
      animateExit(exitDir, velocity);
    } else {
      springRef.current = {
        x: ox,
        y: oy,
        vx: velocity.vx * 8,
        vy: velocity.vy * 8,
      };
      currentOffsetRef.current = { x: 0, y: 0 };
      animateSpringBack();
    }
  }, [computeVelocity, animateExit, animateSpringBack, setCardShadow]);

  // Mouse events
  const onMouseDown = (e: MouseEvent) => handleStart(e.clientX, e.clientY);
  const onMouseMove = (e: MouseEvent) => handleMoveRaw(e.clientX, e.clientY);
  const onMouseUp = () => handleEnd();
  const onMouseLeave = () => { if (isDraggingRef.current) handleEnd(); };

  // Touch events with passive: false for preventDefault
  useEffect(() => {
    const el = cardRef.current;
    if (!el || stackPosition !== 0) return;

    const onTouchStart = (e: TouchEvent) => {
      handleStart(e.touches[0].clientX, e.touches[0].clientY);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (isDraggingRef.current) {
        e.preventDefault();
        handleMoveRaw(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const onTouchEnd = () => handleEnd();

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [stackPosition, handleStart, handleMoveRaw, handleEnd]);

  // Keyboard shortcuts (top card only)
  useEffect(() => {
    if (stackPosition !== 0) return;
    const handler = (e: KeyboardEvent) => {
      if (isExitingRef.current || isAnimatingRef.current) return;
      if (e.key === "o" || e.key === "O" || e.key === "ArrowRight") {
        isExitingRef.current = true;
        currentOffsetRef.current = { x: 0, y: 0 };
        animateExit("right", { vx: 2.5, vy: -0.1 });
      } else if (e.key === "x" || e.key === "X" || e.key === "ArrowLeft") {
        isExitingRef.current = true;
        currentOffsetRef.current = { x: 0, y: 0 };
        animateExit("left", { vx: -2.5, vy: -0.1 });
      } else if (e.key === "?" || e.key === "ArrowUp") {
        isExitingRef.current = true;
        currentOffsetRef.current = { x: 0, y: 0 };
        animateExit("up", { vx: 0, vy: -2.5 });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [stackPosition, onConfusing, animateExit]);

  // Cleanup animation frames
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // --- Behind card (stack position > 0) ---
  if (stackPosition > 0) {
    const baseScale = 1 - STACK_SCALE_STEP * stackPosition;
    const baseY = STACK_Y_STEP * stackPosition;
    const targetScale = 1 - STACK_SCALE_STEP * (stackPosition - 1);
    const targetY = STACK_Y_STEP * (stackPosition - 1);
    const p = dragProgress;
    const scale = baseScale + (targetScale - baseScale) * p;
    const y = baseY + (targetY - baseY) * p;

    return (
      <div className="absolute w-[88%] max-w-md" style={{
        transform: `translateY(${y}px) scale(${scale})`,
        transition: p === 0 ? "transform 0.3s ease-out" : "none",
        zIndex: 10 - stackPosition,
        pointerEvents: "none",
        willChange: "transform",
      }}>
        <div className="card rounded-3xl p-8 min-h-[420px] flex flex-col relative"
          style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)", border: "2px solid transparent" }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-2">
              <span className="pill pill-on text-[11px]">{subjectLabel[subject] || subject}</span>
              <span className="pill pill-off text-[11px]">{cardTypeLabel[cardType] || cardType}</span>
            </div>
            <span className="text-[12px] font-semibold" style={{ color: "#bbb" }}>
              {index + 1 + stackPosition} / {total}
            </span>
          </div>
          <div className="flex-1 flex items-center justify-center py-6">
            <p className="text-[17px] leading-[1.75] text-center font-medium break-keep" style={{ color: "#222" }}>
              {statement}
            </p>
          </div>
          <div className="pt-4" />
        </div>
      </div>
    );
  }

  // --- Top card (interactive) ---
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div
        ref={cardRef}
        className="absolute w-[88%] max-w-md cursor-grab active:cursor-grabbing select-none"
        style={{
          zIndex: 10,
          willChange: "transform",
        }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
      >
        <div
          ref={innerRef}
          className="card rounded-3xl p-8 min-h-[420px] flex flex-col relative"
          style={{
            boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
            border: "2px solid transparent",
          }}
        >
          {/* Swipe indicators */}
          <div data-indicator="O" className="absolute top-6 left-6 z-10 w-14 h-14 rounded-full items-center justify-center"
            style={{ display: "none", border: "3px solid rgba(0,0,0,0.3)", transform: "rotate(-12deg)" }}>
            <span className="font-black text-2xl" style={{ color: "#111" }}>O</span>
          </div>
          <div data-indicator="X" className="absolute top-6 right-6 z-10 w-14 h-14 rounded-full items-center justify-center"
            style={{ display: "none", border: "3px solid rgba(0,0,0,0.3)", transform: "rotate(12deg)" }}>
            <span className="font-black text-2xl" style={{ color: "#111" }}>X</span>
          </div>
          <div data-indicator="?" className="absolute bottom-6 left-1/2 z-10 w-14 h-14 rounded-full items-center justify-center"
            style={{ display: "none", border: "3px solid rgba(0,0,0,0.3)", transform: "translateX(-50%)" }}>
            <span className="font-black text-2xl" style={{ color: "#111" }}>?</span>
          </div>

          {/* Header pills */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-2">
              <span className="pill pill-on text-[11px]">{subjectLabel[subject] || subject}</span>
              <span className="pill pill-off text-[11px]">{cardTypeLabel[cardType] || cardType}</span>
            </div>
            <span className="text-[12px] font-semibold" style={{ color: "#bbb" }}>
              {index + 1} / {total}
            </span>
          </div>

          {/* Statement */}
          <div className="flex-1 flex items-center justify-center py-6">
            <p className="text-[17px] leading-[1.75] text-center font-medium break-keep" style={{ color: "#222" }}>
              {statement}
            </p>
          </div>

          <div className="pt-4" />
        </div>
      </div>
    </div>
  );
}
