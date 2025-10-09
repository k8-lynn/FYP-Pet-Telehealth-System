// src/components/PawPattern.jsx
import React from "react";
import { PawPrint } from "lucide-react";

const PawPattern = ({ count = 80, columns = 9 }) => {
  const rows = Math.ceil(count / columns);
  const cellWidth = 130 / columns;
  const cellHeight = 120 / rows;

  // Fixed rotations for consistent pattern (no random on refresh)
  const fixedRotations = [
    15, 345, 30, 330, 45,
    315, 60, 300, 75, 285,
    90, 270, 105, 255, 120,
    240, 135, 225, 150, 210,
    165, 195, 180, 0, 195
  ];

  return (
    <div className="paw-pattern">
      {Array.from({ length: count }).map((_, idx) => {
        const row = Math.floor(idx / columns);
        const col = idx % columns;

        // Fixed grid position (center of each cell) - no jitter
        const left = col * cellWidth + cellWidth / 2;
        const top = row * cellHeight + cellHeight / 2;

        // Use fixed rotation from pre-defined array
        const rotation = fixedRotations[idx % fixedRotations.length];

        return (
            <PawPrint
              key={idx}
              // Remove the size prop - let CSS handle it
              stroke="#ffffffff"
              strokeWidth={1.2}
              fill="none"
              style={{
                position: "absolute",
                left: `${left}%`,
                top: `${top}%`,
                transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                opacity: 1.0,
                pointerEvents: "none"
              }}
            />
          );
      })}
    </div>
  );
};

export default PawPattern;