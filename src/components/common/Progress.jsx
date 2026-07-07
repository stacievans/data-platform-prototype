export default function Progress({ percent, color = 'bg-blue-500', showText = true }) {
  return (
    <div className="flex w-32 items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
        <div
          className={`h-full rounded-full ${percent >= 100 ? 'bg-emerald-500' : color}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      {showText && (
        <span className="w-9 text-right text-xs text-gray-500">{percent}%</span>
      )}
    </div>
  )
}
