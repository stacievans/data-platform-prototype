const MODE_LABELS = {
  play: '播放',
  review: '标注',
  accept: '验收',
}

const MODE_BADGE_CLS = {
  play: 'bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-200',
  review: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200',
  accept: 'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200',
}

export default function WorkbenchModeBadge({ mode }) {
  const key = MODE_LABELS[mode] ? mode : 'play'
  return (
    <span
      className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${MODE_BADGE_CLS[key]}`}
    >
      {MODE_LABELS[key]}
    </span>
  )
}
