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
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
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

  const onTouchStart = (e: TouchEvent) => handleStart(e.touches[0].clientX, e.touches[0].clientY);
  const onTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientX, e.touches[0].clientY);
  const onTouchEnd = () => handleEnd();
  const onMouseDown = (e: MouseEvent) => handleStart(e.clientX, e.clientY);
  const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
  const onMouseUp = () => handleEnd();
  const onMouseLeave = () => { if (isDragging) handleEnd(); };

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
    ? isExiting === "right" ? "translateX(150%) rotate(30deg)" : "translateX(-150%) rotate(-30deg)"
    : `translateX(${offsetX}px) translateY(${offsetY}px) rotate(${rotation}deg)`;

  const subjectLabel: Record<string, string> = { civil: "민법", criminal: "형법", public: "공법", mixed: "혼합" };
  const cardTypeLabel: Record<string, string> = { REQ: "요건", EFF: "효과", EXC: "예외", BUR: "증명책임", CMP: "비교", GEN: "일반" };

  const swipeProgress = Math.min(Math.abs(offsetX) / SWIPE_THRESHOLD, 1);
  const isRight = offsetX > 30;
  const isLeft = offsetX < -30;

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div
        ref={cardRef}
        className="absolute w-[88%] max-w-md cursor-grab active:cursor-grabbing select-none anim-scale"
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
        {/* 3번 사진 스타일 카드 */}
        <div
          className="card rounded-3xl p-8 min-h-[420px] flex flex-col relative"
          style={{
            boxShadow: isRight
              ? `0 8px 40px rgba(0,0,0,${0.06 + swipeProgress * 0.1})`
              : isLeft
                ? `0 8px 40px rgba(0,0,0,${0.06 + swipeProgress * 0.1})`
                : "0 4px 24px rgba(0,0,0,0.06)",
            border: isRight
              ? `2px solid rgba(0,0,0,${swipeProgress * 0.3})`
              : isLeft
                ? `2px solid rgba(0,0,0,${swipeProgress * 0.3})`
                : "2px solid transparent",
            transition: isDragging ? "box-shadow 0.08s, border-color 0.08s" : "all 0.3s ease-out",
          }}
        >
          {/* Swipe indicator */}
          {isRight && (
            <div className="absolute top-6 left-6 z-10 w-14 h-14 rounded-full flex items-center justify-center" style={{ border: `3px solid rgba(0,0,0,${0.2 + swipeProgress * 0.6})`, transform: "rotate(-12deg)" }}>
              <span className="font-black text-2xl" style={{ color: "#111" }}>O</span>
            </div>
          )}
          {isLeft && (
            <div className="absolute top-6 right-6 z-10 w-14 h-14 rounded-full flex items-center justify-center" style={{ border: `3px solid rgba(0,0,0,${0.2 + swipeProgress * 0.6})`, transform: "rotate(12deg)" }}>
              <span className="font-black text-2xl" style={{ color: "#111" }}>X</span>
            </div>
          )}

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

          {/* Hint */}
          <div className="flex justify-between items-center pt-5" style={{ borderTop: "1px solid #f0f0f0" }}>
            <span className="text-[11px] font-medium" style={{ color: "#ccc" }}>← X</span>
            <span className="text-[11px] font-medium" style={{ color: "#ccc" }}>↓ ?</span>
            <span className="text-[11px] font-medium" style={{ color: "#ccc" }}>O →</span>
          </div>
        </div>
      </div>
    </div>
  );
}
