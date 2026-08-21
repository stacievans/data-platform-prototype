import Button from './Button'
import { PermButton } from './PermissionAction'

const LINK_DISABLED =
  'inline-flex items-center justify-center text-sm text-gray-400 cursor-not-allowed opacity-60 px-1'

function openWorkbench(entryId, mode) {
  window.open(`/review/${entryId}?mode=${mode}`, '_blank', 'noopener,noreferrer')
}

function MiddleSlot({ entry, onOpen }) {
  const { dataStatus } = entry

  if (dataStatus === '已验收') {
    return (
      <div className="flex items-center justify-center">
        <span className="invisible select-none text-xs" aria-hidden="true">占位</span>
      </div>
    )
  }

  if (dataStatus === '已上传' || entry.batchQcPending) {
    return (
      <button type="button" disabled className={LINK_DISABLED} title="解析中，暂不可标注">
        标注
      </button>
    )
  }

  if (dataStatus === '已解析' || dataStatus === '验收不通过') {
    return (
      <Button variant="link" size="sm" onClick={() => onOpen('review')} className="justify-center">
        标注
      </Button>
    )
  }

  if (dataStatus === '已标注' || dataStatus === '标注不通过') {
    return (
      <Button variant="link" size="sm" onClick={() => onOpen('accept')} className="justify-center">
        验收
      </Button>
    )
  }

  return (
    <div className="flex items-center justify-center">
      <span className="invisible select-none text-xs" aria-hidden="true">占位</span>
    </div>
  )
}

/**
 * 采集条目统一操作栏：固定 4 列 [ 播放 | 中间按钮 | 下载 | 删除 ]
 * TODO: 中间按钮角色校验（标注=标注员、验收=平台运营）
 */
export default function EntryActions({
  entry,
  onPlay,
  onReview,
  onAccept,
  onDownload,
  onDelete,
  hideDownload = false,
  compact = false,
}) {
  const goWorkbench = (mode) => {
    openWorkbench(entry.id, mode)
    if (mode === 'play') onPlay?.(entry)
    if (mode === 'review') onReview?.(entry)
    if (mode === 'accept') onAccept?.(entry)
  }

  const handleDownload = () => {
    console.log('下载', entry.id, entry.fileName)
    onDownload?.(entry)
  }

  return (
    <div className={`grid items-center ${compact ? 'w-fit grid-cols-3 gap-0' : hideDownload ? 'min-w-[186px] grid-cols-3 gap-1' : 'min-w-[248px] grid-cols-4 gap-1'}`}>
      <Button variant="link" size="sm" onClick={() => goWorkbench('play')} className="justify-center">
        播放
      </Button>
      <MiddleSlot entry={entry} onOpen={goWorkbench} />
      {!hideDownload && (
        <PermButton
          permission="collection.upload.download"
          mode="disable"
          variant="link"
          size="sm"
          onClick={handleDownload}
          className="justify-center"
        >
          下载
        </PermButton>
      )}
      <PermButton
        permission="collection.upload.delete"
        mode="disable"
        variant="linkDanger"
        size="sm"
        onClick={() => onDelete?.(entry)}
        className="justify-center"
      >
        删除
      </PermButton>
    </div>
  )
}
