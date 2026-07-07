/** 可视化面板；showPlayhead 为 true 时叠加播放游标竖线 */
export default function PlayheadOverlay({ playPct, label, className = '', children, showPlayhead = true }) {
  return (
    <div className={`relative min-h-0 overflow-hidden rounded border border-gray-200/80 bg-white ${className}`}>
      <div className="absolute inset-0">{children}</div>
      {showPlayhead && (
        <div
          className="pointer-events-none absolute top-0 bottom-0 z-20 w-0.5 bg-blue-500"
          style={{ left: `${playPct}%`, transform: 'translateX(-50%)' }}
        />
      )}
      {label && (
        <span className="pointer-events-none absolute left-1.5 top-1 z-30 rounded bg-black/45 px-1.5 py-0.5 text-[10px] leading-none text-white">
          {label}
        </span>
      )}
    </div>
  )
}
