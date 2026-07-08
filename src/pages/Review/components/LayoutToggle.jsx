/** 主区布局 A / B 切换 */
export default function LayoutToggle({ value = 'A', onChange }) {
  return (
    <div
      className="flex h-8 items-center rounded-md border border-gray-200 bg-gray-50 p-0.5"
      role="group"
      aria-label="主区布局切换"
    >
      {['A', 'B'].map((key) => {
        const active = value === key
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange?.(key)}
            className={`rounded px-2.5 py-1 text-xs font-medium transition ${
              active
                ? 'bg-white text-blue-600 shadow-sm'
                : 'cursor-pointer text-gray-500 hover:text-gray-700'
            }`}
          >
            布局{key}
          </button>
        )
      })}
    </div>
  )
}
