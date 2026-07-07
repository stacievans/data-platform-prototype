const colorMap = {
  blue: 'bg-blue-50 text-blue-600 border-blue-200',
  green: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  red: 'bg-red-50 text-red-600 border-red-200',
  orange: 'bg-amber-50 text-amber-600 border-amber-200',
  gray: 'bg-gray-100 text-gray-500 border-gray-200',
  dark: 'bg-gray-200 text-gray-600 border-gray-300',
  purple: 'bg-purple-50 text-purple-600 border-purple-200',
  cyan: 'bg-cyan-50 text-cyan-600 border-cyan-200',
}

export default function Badge({ color = 'blue', dot = false, children }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-medium whitespace-nowrap ${colorMap[color] || colorMap.blue}`}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}
