"use client";
import { useState } from "react";
import { Flame } from "lucide-react";

interface DataPoint {
  label: string;
  value: number;
}

const WIDTH = 700;
const HEIGHT = 260;
const PADDING_LEFT = 40;
const PADDING_BOTTOM = 24;
const PADDING_TOP = 10;
const Y_MAX = 800;
const Y_TICKS = [0, 200, 400, 600, 800];

export function PerformanceChart({ data }: { data: DataPoint[] }) {
  const [view, setView] = useState<"line" | "bar">("line");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const plotWidth = WIDTH - PADDING_LEFT;
  const plotHeight = HEIGHT - PADDING_BOTTOM - PADDING_TOP;
  const stepX = data.length > 1 ? plotWidth / (data.length - 1) : 0;

  const xFor = (i: number) => PADDING_LEFT + i * stepX;
  const yFor = (v: number) => PADDING_TOP + plotHeight - (v / Y_MAX) * plotHeight;

  const linePath = data.map((d, i) => `${i === 0 ? "M" : "L"} ${xFor(i)} ${yFor(d.value)}`).join(" ");
  const barWidth = data.length > 0 ? Math.min(28, (plotWidth / data.length) * 0.5) : 0;

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 font-bold">
          <Flame size={18} className="text-primary" />
          Performance History
        </div>
        <div className="flex bg-secondary rounded-full p-1 text-xs font-medium">
          <button
            type="button"
            onClick={() => setView("line")}
            className={`px-4 py-1.5 rounded-full transition-colors ${view === "line" ? "bg-primary text-white" : "text-muted-foreground"}`}
          >
            Line
          </button>
          <button
            type="button"
            onClick={() => setView("bar")}
            className={`px-4 py-1.5 rounded-full transition-colors ${view === "bar" ? "bg-primary text-white" : "text-muted-foreground"}`}
          >
            Bar
          </button>
        </div>
      </div>

      <div className="relative overflow-x-auto">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full min-w-[500px]" onMouseLeave={() => setHoverIndex(null)}>
          {Y_TICKS.map((tick) => (
            <g key={tick}>
              <line
                x1={PADDING_LEFT}
                x2={WIDTH}
                y1={yFor(tick)}
                y2={yFor(tick)}
                stroke="var(--border)"
                strokeDasharray="4 4"
              />
              <text x={0} y={yFor(tick) + 4} fontSize="11" fill="var(--muted-foreground)">
                {tick}
              </text>
            </g>
          ))}

          {data.map((d, i) => (
            <text key={d.label} x={xFor(i)} y={HEIGHT - 4} fontSize="11" fill="var(--muted-foreground)" textAnchor="middle">
              {d.label}
            </text>
          ))}

          {view === "line" ? (
            <>
              <path d={linePath} fill="none" stroke="var(--primary)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
              {data.map((d, i) => (
                <circle key={d.label} cx={xFor(i)} cy={yFor(d.value)} r={hoverIndex === i ? 6 : 4} fill="var(--primary)" />
              ))}
            </>
          ) : (
            data.map((d, i) => (
              <rect
                key={d.label}
                x={xFor(i) - barWidth / 2}
                y={yFor(d.value)}
                width={barWidth}
                height={plotHeight + PADDING_TOP - yFor(d.value)}
                rx={4}
                fill="var(--primary)"
                opacity={hoverIndex === i ? 1 : 0.85}
              />
            ))
          )}

          {data.map((d, i) => (
            <rect
              key={`hit-${d.label}`}
              x={xFor(i) - stepX / 2}
              y={0}
              width={stepX || plotWidth}
              height={HEIGHT}
              fill="transparent"
              onMouseEnter={() => setHoverIndex(i)}
            />
          ))}

          {hoverIndex !== null && (
            <line x1={xFor(hoverIndex)} x2={xFor(hoverIndex)} y1={PADDING_TOP} y2={PADDING_TOP + plotHeight} stroke="var(--muted-foreground)" strokeWidth={1} />
          )}
        </svg>

        {hoverIndex !== null && (
          <div
            className="absolute bg-popover border border-border rounded-lg px-3 py-2 text-sm pointer-events-none shadow-lg"
            style={{
              left: `${(xFor(hoverIndex) / WIDTH) * 100}%`,
              top: `${(yFor(data[hoverIndex].value) / HEIGHT) * 100}%`,
              transform: "translate(8px, -110%)",
            }}
          >
            <p className="font-semibold">{data[hoverIndex].label}</p>
            <p className="text-muted-foreground">score : {data[hoverIndex].value}</p>
          </div>
        )}
      </div>
    </div>
  );
}
