export default function Tabs({ items, activeKey, onChange, className = '' }) {
  return (
    <div className={`flex gap-6 border-b border-gray-200 ${className}`}>
      {items.map((item) => (
        <button
          key={item.key}
          onClick={() => onChange(item.key)}
          className={`-mb-px cursor-pointer border-b-2 pb-2.5 pt-1 text-sm transition-colors ${
            activeKey === item.key
              ? 'border-blue-600 font-medium text-blue-600'
              : 'border-transparent text-gray-500 hover:text-blue-500'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
