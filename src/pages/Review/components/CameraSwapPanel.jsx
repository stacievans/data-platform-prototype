import { useState } from 'react'
import PlayheadOverlay from './PlayheadOverlay'
import CameraMock from './CameraMock'

const VIEW_LABELS = {
  head: '头部 · 主视角',
  chest: '胸部',
  leftWrist: '左腕',
  rightWrist: '右腕',
}

const DEFAULT_THUMBS = ['chest', 'leftWrist', 'rightWrist']

function CameraThumb({ view, playPct, onSwap, className = '' }) {
  return (
    <PlayheadOverlay
      playPct={playPct}
      label={VIEW_LABELS[view]}
      showPlayhead={false}
      className={`group min-h-0 ${className}`}
    >
      <button
        type="button"
        className="relative h-full w-full cursor-pointer border-0 bg-transparent p-0"
        aria-label={`${VIEW_LABELS[view]}，点击切换主画面`}
        onClick={onSwap}
      >
        <CameraMock view={view} />
        <span className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="px-2 text-center text-xs font-medium text-white">点击切换主画面</span>
        </span>
      </button>
    </PlayheadOverlay>
  )
}

/**
 * @param {'stack'|'side'} variant — stack：主画面上 + 小图横排（布局 B）；side：主画面左 + 小图竖排（布局 A）
 */
export default function CameraSwapPanel({ playPct, variant = 'stack' }) {
  const [mainView, setMainView] = useState('head')
  const [thumbViews, setThumbViews] = useState(DEFAULT_THUMBS)

  const swapWithMain = (clicked) => {
    setMainView(clicked)
    setThumbViews((prev) => prev.map((v) => (v === clicked ? mainView : v)))
  }

  const mainPanel = (
    <PlayheadOverlay
      playPct={playPct}
      label={VIEW_LABELS[mainView]}
      showPlayhead={false}
      className={
        variant === 'stack'
          ? 'min-h-0 flex-[3]'
          : 'h-full min-h-0 min-w-0 flex-[2]'
      }
    >
      <CameraMock view={mainView} />
    </PlayheadOverlay>
  )

  const thumbs = thumbViews.map((view) => (
    <CameraThumb
      key={view}
      view={view}
      playPct={playPct}
      onSwap={() => swapWithMain(view)}
      className={variant === 'stack' ? 'min-w-0 flex-1' : 'min-h-0 flex-1'}
    />
  ))

  if (variant === 'side') {
    return (
      <div className="flex h-full min-h-0 min-w-0 flex-[2] gap-2">
        {mainPanel}
        <div className="flex min-h-0 min-w-0 flex-[1] flex-col gap-1">{thumbs}</div>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-[2] flex-col gap-1">
      {mainPanel}
      <div className="flex min-h-0 flex-1 gap-1">{thumbs}</div>
    </div>
  )
}
