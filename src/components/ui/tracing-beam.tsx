import React, { useEffect, useRef, useState } from "react";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";

function cn(...parts: Array<string | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/** Aceternity tracing beam. Scroll container is required because the landing reader is not the window. */
export const TracingBeam = ({
  children,
  className,
  container,
}: {
  children: React.ReactNode;
  className?: string;
  container: React.RefObject<HTMLElement | null>;
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [svgHeight, setSvgHeight] = useState(0);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const measure = () => setSvgHeight(el.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [children]);

  const { scrollYProgress } = useScroll({
    container,
    target: contentRef,
    offset: ["start start", "end end"],
  });

  const y1 = useSpring(
    useTransform(scrollYProgress, [0, 0.8], [50, svgHeight]),
    { stiffness: 500, damping: 90 },
  );
  const y2 = useSpring(
    useTransform(scrollYProgress, [0, 1], [50, Math.max(50, svgHeight - 200)]),
    { stiffness: 500, damping: 90 },
  );

  return (
    <motion.div className={cn("relative mx-auto h-full w-full max-w-4xl", className)}>
      <div className="absolute top-3 -left-4 md:-left-12">
        <div className="ml-[27px] flex h-4 w-4 items-center justify-center rounded-full border border-emerald-400/40">
          <div className="h-2 w-2 rounded-full bg-emerald-400" />
        </div>
        <svg
          viewBox={`0 0 20 ${svgHeight}`}
          width="20"
          height={svgHeight}
          className="ml-4 block"
          aria-hidden="true"
        >
          <motion.path
            d={`M 1 0V -36 l 18 24 V ${svgHeight * 0.8} l -18 24V ${svgHeight}`}
            fill="none"
            stroke="#9091A0"
            strokeOpacity="0.16"
          />
          <motion.path
            d={`M 1 0V -36 l 18 24 V ${svgHeight * 0.8} l -18 24V ${svgHeight}`}
            fill="none"
            stroke="url(#esg-beam)"
            strokeWidth="1.25"
          />
          <defs>
            <motion.linearGradient
              id="esg-beam"
              gradientUnits="userSpaceOnUse"
              x1="0"
              x2="0"
              y1={y1}
              y2={y2}
            >
              <stop stopColor="#18CCFC" stopOpacity="0" />
              <stop stopColor="#18CCFC" />
              <stop offset="0.325" stopColor="#34d399" />
              <stop offset="1" stopColor="#AE48FF" stopOpacity="0" />
            </motion.linearGradient>
          </defs>
        </svg>
      </div>
      <div ref={contentRef}>{children}</div>
    </motion.div>
  );
};
