interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  height?: number;
  unit?: string;
  maxBars?: number;
  color?: string;
}

export function BarChart({
  data,
  height = 200,
  unit = '',
  maxBars = 12,
  color,
}: BarChartProps) {
  const visible = data.slice(-maxBars);
  const maxVal = Math.max(...visible.map((d) => d.value), 1);
  const barWidth = 100 / visible.length;

  return (
    <div className="w-full">
      <div
        className="relative w-full flex items-end gap-1"
        style={{ height }}
      >
        {visible.map((d, i) => {
          const h = maxVal > 0 ? (d.value / maxVal) * 100 : 0;
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center justify-end group relative"
              style={{ minWidth: `${barWidth}%` }}
            >
              <div className="absolute -top-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap pointer-events-none z-10 -translate-y-full">
                {d.label}: {d.value.toLocaleString()}{unit}
              </div>
              <div
                className="w-full rounded-t-lg transition-all duration-300 hover:opacity-80"
                style={{
                  height: `${h}%`,
                  backgroundColor: d.color || color || '#22c55e',
                  minHeight: d.value > 0 ? '4px' : '0',
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-1 mt-2">
        {visible.map((d, i) => (
          <div
            key={i}
            className="flex-1 text-center text-[10px] text-gray-400 font-medium truncate"
            style={{ minWidth: `${barWidth}%` }}
          >
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}
