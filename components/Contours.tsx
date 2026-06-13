"use client";

/**
 * Contours — the site's signature motif.
 * Topographic contour lines that echo the hilly terrain of Bharog Baneri,
 * a village "a mile above sea level" in the Himalayan foothills.
 * Used as a quiet ambient texture behind sections and the hero.
 */
export default function Contours({
  className = "",
  stroke = "currentColor",
  opacity = 0.5,
}: {
  className?: string;
  stroke?: string;
  opacity?: number;
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 1200 600"
      fill="none"
      preserveAspectRatio="xMidYMid slice"
      style={{ opacity }}
    >
      <g stroke={stroke} strokeWidth="1" fill="none">
        <path d="M-50 470 C 200 410, 360 500, 560 440 S 960 360, 1260 430" />
        <path d="M-50 420 C 200 360, 360 450, 560 390 S 960 310, 1260 380" />
        <path d="M-50 370 C 200 310, 360 400, 560 340 S 960 260, 1260 330" />
        <path d="M-50 320 C 220 270, 380 350, 580 300 S 980 230, 1260 290" />
        <path d="M-50 270 C 240 230, 400 300, 600 260 S 1000 200, 1260 250" />
        <path d="M-50 220 C 260 190, 420 250, 620 220 S 1020 175, 1260 215" />
        <path d="M-50 175 C 280 150, 440 205, 640 185 S 1040 150, 1260 180" />
        <path d="M-50 135 C 300 118, 460 165, 660 150 S 1060 128, 1260 150" />
      </g>
    </svg>
  );
}
