"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type TouchEvent,
  type MouseEvent,
} from "react";

interface SwipeCardProps {
  statement: string;
  cardType: string;
  subject: string;
  index: number;
  total: number;
  onSwipeRight: () => void; // O (correct)
  onSwipeLeft: () => void; // X (wrong)
  onConfusing: () => void;
}

const SWIPE_THRESHOLD = 80;
const ROTATION_FACTOR = 0.1;

export default function SwipeCard({
  statement,
  cardType,
  subject,
  index,
  total,
  onSwipeRight,
  onSwipeLeft,
  onConfusing,
}: SwipeCardProps) {
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isExiting, setIsExiting] = useState<"left" | "right" | null>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleStart = useCallback((clientX: number, clientY: number) => {
    setIsDragging(true);
    startX.current = clientX;
    startY.current = clientY;
  }, []);

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDragging) return;
      setOffsetX(clientX - startX.current);
      setOffsetY((clientY - startY.current) * 0.3);
    },
    [isDragging]
  );

  const handleEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    if (offsetX > SWIPE_THRESHOLD) {
      setIsExiting("right");
      setTimeout(onSwipeRight, 300);
    } else if (offsetX < -SWIPE_THRESHOLD) {
      setIsExiting("left");
      setTimeout(onSwipeLeft, 300);
    } else {
      setOffsetX(0);
      setOffsetY(0);
    }
  }, [isDragging, offsetX, onSwipeRight, onSwipeLeft]);

  const onTouchStart = (e: TouchEvent) =>
    handleStart(e.touches[0].clientX, e.touches[0].clientY);
  const onTouchMove = (e: TouchEvent) =>
    handleMove(e.touches[0].clientX, e.touches[0].clientY);
  const onTouchEnd = () => handleEnd();

  const onMouseDown = (e: MouseEvent) => handleStart(e.clientX, e.clientY);
  const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
  const onMouseUp = () => handleEnd();
  const onMouseLeave = () => {
    if (isDragging) handleEnd();
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "o" || e.key === "O" || e.key === "ArrowRight") {
        setIsExiting("right");
        setTimeout(onSwipeRight, 300);
      } else if (e.key === "x" || e.key === "X" || e.key === "ArrowLeft") {
        setIsExiting("left");
        setTimeout(onSwipeLeft, 300);
      } else if (e.key === "?" || e.key === "ArrowDown") {
        onConfusing();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onSwipeRight, onSwipeLeft, onConfusing]);

  const rotation = offsetX * ROTATION_FACTOR;
  const opacity = isExiting ? 0 : 1;

  const exitTransform = isExiting
    ? isExiting === "right"
      ? "translateX(150%) rotate(30deg)"
      : "translateX(-150%) rotate(-30deg)"
    : `translateX(${offsetX}px) translateY(${offsetY}px) rotate(${rotation}deg)`;

  const subjectLabel: Record<string, string> = {
    civil: "민법",
    criminal: "형법",
    public: "공법",
    mixed: "혼합",
  };

  const cardTypeLabel: Record<string, string> = {
    REQ: "요건",
    EFF: "효과",
    EXC: "예외",
    BUR: "증명책임",
    CMP: "비교",
    GEN: "일반",
  };

  const swipeIndicator = () => {
    if (offsetX > 30)
      return (
        <div className="absolute top-6 left-6 z-10 border-4 border-green-500 text-green-500 font-black text-3xl px-4 py-1 rounded-lg rotate-[-15deg] opacity-90">
          O
        </div>
      );
    if (offsetX < -30)
      return (
        <div className="absolute top-6 right-6 z-10 border-4 border-red-500 text-red-500 font-black text-3xl px-4 py-1 rounded-lg rotate-[15deg] opacity-90">
          X
        </div>
      );
    return null;
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div
        ref={cardRef}
        className="absolute w-[90%] max-w-md cursor-grab active:cursor-grabbing select-none"
        style={{
          transform: exitTransform,
          opacity,
          transition: isDragging ? "none" : "all 0.3s ease-out",
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
      >
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 min-h-[320px] flex flex-col">
          {swipeIndicator()}

          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                {subjectLabel[subject] || subject}
              </span>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">
                {cardTypeLabel[cardType] || cardType}
              </span>
            </div>
            <span className="text-xs text-slate-400">
              {index + 1} / {total}
            </span>
          </div>

          {/* Statement */}
          <div className="flex-1 flex items-center justify-center">
            <p className="text-lg leading-relaxed text-center text-slate-800 font-medium break-keep">
              {statement}
            </p>
          </div>

          {/* Swipe hint */}
          <div className="flex justify-between items-center mt-6 text-xs text-slate-300">
            <span>← X (틀림)</span>
            <span>↓ 헷갈림</span>
            <span>O (맞음) →</span>
          </div>
        </div>
      </div>
    </div>
  );
}
