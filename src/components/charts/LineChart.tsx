interface LineChartProps {
  data: { label: string; value: number }[];
  height?: number;
  unit?: string;
  color?: string;
  maxPoints?: number;
}

export function LineChart({
  data,
  height = 200,
  unit = '',
  color = '#22c55e',
  maxPoints = 14,
}: LineChartProps) {
  const visible = data.slice(-maxPoints);
  if (visible.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-gray-400 text-sm"
        style={{ height }}
      >
        No data yet
      </div>
    );
  }

  const maxVal = Math.max(...visible.map((d) => d.value), 1);
  const minVal = Math.min(...visible.map((d) => d.value), 0);
  const range = maxVal - minVal || 1;

  const width = 100;
  const padding = 4;

  const points = visible.map((d, i) => {
    const x = (i / Math.max(visible.length - 1, 1)) * (width - padding * 2) + padding;
    const y =
      height -
      ((d.value - minVal) / range) * (height - padding * 2 - 20) -
      padding -
      10;
    return { x, y, ...d };
  });

  const pathD = points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(' ');

  const areaD =
    `M ${points[0].x} ${height - padding - 10} ` +
    points.map((p) => `L ${p.x} ${p.y}`).join(' ') +
    ` L ${points[points.length - 1].x} ${height - padding - 10} Z`;

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height }}
      >
        <defs>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#lineGradient)" />
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="1.2" fill={color} />
          </g>
        ))}
      </svg>
      <div className="flex justify-between mt-1 text-[10px] text-gray-400 font-medium">
        {visible.map((d, i) => {
          if (
            visible.length > 8 &&
            i !== 0 &&
            i !== visible.length - 1 &&
            i % Math.ceil(visible.length / 6) !== 0
          )
            return null;
          return <span key={i}>{d.label}</span>;
        })}
      </div>
      <div className="flex justify-between mt-0.5 text-[10px] text-gray-300">
        <span>Min: {minVal.toFixed(1)}{unit}</span>
        <span>Max: {maxVal.toFixed(1)}{unit}</span>
      </div>
    </div>
  );
}
