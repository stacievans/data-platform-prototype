export default function StatCard({ title, value, unit, trend, icon, iconBg = 'bg-blue-50 text-blue-600' }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <span className="text-sm text-gray-500">{title}</span>
        {icon && (
          <span className={`flex h-8 w-8 items-center justify-center rounded-md ${iconBg}`}>
            {icon}
          </span>
        )}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-2xl font-semibold tracking-tight text-gray-800">{value}</span>
        {unit && <span className="text-sm text-gray-400">{unit}</span>}
      </div>
      {trend !== undefined && (
        <div className="mt-2 text-xs text-gray-400">
          较上月{' '}
          <span className={trend >= 0 ? 'text-emerald-500' : 'text-red-500'}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        </div>
      )}
    </div>
  )
}
