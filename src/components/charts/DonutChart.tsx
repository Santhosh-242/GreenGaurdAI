interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
}

export function DonutChart({
  data,
  size = 160,
  thickness = 28,
  centerLabel,
  centerValue,
}: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  const segments = data
    .filter((d) => d.value > 0)
    .map((d) => {
      const fraction = total > 0 ? d.value / total : 0;
      const dash = fraction * circumference;
      const seg = {
        ...d,
        dash,
        gap: circumference - dash,
        offset: -offset,
      };
      offset += dash;
      return seg;
    });

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#f3f4f6"
            strokeWidth={thickness}
          />
          <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            {segments.map((s, i) => (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={s.color}
                strokeWidth={thickness}
                strokeDasharray={`${s.dash} ${s.gap}`}
                strokeDashoffset={s.offset}
                strokeLinecap="butt"
                className="transition-all duration-700"
              />
            ))}
          </g>
        </svg>
        {(centerLabel || centerValue) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {centerValue && (
              <span className="text-2xl font-bold text-gray-900">
                {centerValue}
              </span>
            )}
            {centerLabel && (
              <span className="text-xs text-gray-400 font-medium mt-0.5">
                {centerLabel}
              </span>
            )}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2 w-full">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-2 text-sm">
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: d.color }}
            />
            <span className="text-gray-600 flex-1">{d.label}</span>
            <span className="font-semibold text-gray-900">
              {total > 0 ? Math.round((d.value / total) * 100) : 0}%
            </span>
            <span className="text-gray-400 text-xs w-16 text-right">
              {d.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
