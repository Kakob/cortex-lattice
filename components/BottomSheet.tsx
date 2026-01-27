"use client";

/**
 * BottomSheet - iOS-style draggable bottom sheet
 *
 * Uses framer-motion for smooth drag gestures with velocity-based snapping.
 * Three snap points: closed, half (50%), full (90%).
 */

import { ReactNode, useCallback, useMemo } from "react";
import { motion, useAnimation, PanInfo, useDragControls } from "framer-motion";
import { GripHorizontal } from "lucide-react";

interface BottomSheetProps {
  children: ReactNode;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

// Snap points as percentages of viewport height
const SNAP_POINTS = {
  closed: 0,
  peek: 11, // Show the drag handle with "Learning Guide" text
  half: 50,
  full: 90,
};

// Minimum velocity to trigger snap
const VELOCITY_THRESHOLD = 500;

export function BottomSheet({
  children,
  isOpen,
  onOpenChange,
}: BottomSheetProps) {
  const controls = useAnimation();
  const dragControls = useDragControls();

  // Calculate snap position in pixels
  const getSnapPosition = useCallback((snapPoint: keyof typeof SNAP_POINTS) => {
    if (typeof window === "undefined") return 0;
    const vh = window.innerHeight;
    return vh * (1 - SNAP_POINTS[snapPoint] / 100);
  }, []);

  // Determine which snap point to use based on velocity and position
  const determineSnapPoint = useCallback(
    (currentY: number, velocityY: number) => {
      const vh = window.innerHeight;
      const currentPercent = ((vh - currentY) / vh) * 100;

      // Fast swipe up
      if (velocityY < -VELOCITY_THRESHOLD) {
        if (currentPercent < 30) return "half";
        return "full";
      }

      // Fast swipe down
      if (velocityY > VELOCITY_THRESHOLD) {
        if (currentPercent > 70) return "half";
        return "peek";
      }

      // Position-based snap
      if (currentPercent > 70) return "full";
      if (currentPercent > 30) return "half";
      return "peek";
    },
    []
  );

  // Handle drag end
  const handleDragEnd = useCallback(
    async (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const currentY = info.point.y;
      const snapPoint = determineSnapPoint(currentY, info.velocity.y);
      const newPosition = getSnapPosition(snapPoint);

      await controls.start({
        y: newPosition,
        transition: {
          type: "spring",
          damping: 40,
          stiffness: 400,
        },
      });

      onOpenChange(snapPoint !== "peek");
    },
    [controls, determineSnapPoint, getSnapPosition, onOpenChange]
  );

  // Toggle sheet
  const handleToggle = useCallback(async () => {
    const newState = !isOpen;
    const snapPoint = newState ? "half" : "peek";
    const newPosition = getSnapPosition(snapPoint);

    await controls.start({
      y: newPosition,
      transition: {
        type: "spring",
        damping: 40,
        stiffness: 400,
      },
    });

    onOpenChange(newState);
  }, [isOpen, controls, getSnapPosition, onOpenChange]);

  // Initial position
  const initialY = useMemo(() => {
    if (typeof window === "undefined") return "85%";
    return getSnapPosition("peek");
  }, [getSnapPosition]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-black"
          onClick={handleToggle}
        />
      )}

      {/* Sheet */}
      <motion.div
        drag="y"
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: getSnapPosition("full"), bottom: getSnapPosition("peek") }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        initial={{ y: initialY }}
        animate={controls}
        className="fixed inset-x-0 bottom-0 z-50 flex h-screen flex-col rounded-t-2xl bg-surface shadow-2xl"
      >
        {/* Drag handle - only this area initiates drag */}
        <div
          className="flex cursor-grab items-center justify-center py-3 active:cursor-grabbing select-none"
          onPointerDown={(e) => dragControls.start(e)}
          onClick={handleToggle}
          style={{ touchAction: "none" }}
        >
          <div className="flex items-center gap-2">
            <GripHorizontal className="h-5 w-5 text-gray-500" />
            <span className="text-xs text-gray-400">
              {isOpen ? "Close" : "Learning Guide"}
            </span>
          </div>
        </div>

        {/* Content - allows text selection and scrolling */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-safe select-text">
          {children}
        </div>
      </motion.div>
    </>
  );
}

export default BottomSheet;
