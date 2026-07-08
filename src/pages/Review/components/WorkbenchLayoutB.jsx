import { useState } from 'react'
import PlayheadOverlay from './PlayheadOverlay'
import CameraMock from './CameraMock'
import UrdfTrajectoryMock from './UrdfTrajectoryMock'
import SignalChartMock from './SignalChartMock'

const VIEW_LABELS = {
  head: '头部 · 主视角',
  chest: '胸部',
  leftWrist: '左腕',
  rightWrist: '右腕',
}

const SIGNAL_PANELS = [
  { type: 'joint', side: 'left', label: '左臂关节' },
  { type: 'pose', side: 'left', label: '左末端位姿' },
  { type: 'gripper', side: 'left', label: '左夹爪' },
  { type: 'joint', side: 'right', label: '右臂关节' },
  { type: 'pose', side: 'right', label: '右末端位姿' },
  { type: 'gripper', side: 'right', label: '右夹爪' },
]

function CameraSwapArea({ playPct }) {
  const [mainView, setMainView] = useState('head')
  const [thumbViews, setThumbViews] = useState(['chest', 'leftWrist', 'rightWrist'])

  const swapWithMain = (clicked) => {
    setMainView(clicked)
    setThumbViews((prev) => prev.map((v) => (v === clicked ? mainView : v)))
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-[2] flex-col gap-1">
      <PlayheadOverlay
        playPct={playPct}
        label={VIEW_LABELS[mainView]}
        showPlayhead={false}
        className="min-h-0 flex-[3]"
      >
        <CameraMock view={mainView} />
      </PlayheadOverlay>
      <div className="flex min-h-0 flex-1 gap-1">
        {thumbViews.map((view) => (
          <PlayheadOverlay
            key={view}
            playPct={playPct}
            label={VIEW_LABELS[view]}
            showPlayhead={false}
            className="min-h-0 min-w-0 flex-1 cursor-pointer transition hover:ring-2 hover:ring-blue-400/60"
          >
            <button
              type="button"
              className="h-full w-full cursor-pointer border-0 bg-transparent p-0"
              title={`点击与主视角互换 · ${VIEW_LABELS[view]}`}
              onClick={() => swapWithMain(view)}
            >
              <CameraMock view={view} />
            </button>
          </PlayheadOverlay>
        ))}
      </div>
    </div>
  )
}

/** 布局 B：左 6 列信号图 · 中图像互换 · 右 URDF */
export default function WorkbenchLayoutB({ playPct, signalSeries, totalFrames }) {
  return (
    <div className="flex min-h-0 flex-1 gap-2">
      <div className="flex h-full w-[168px] shrink-0 flex-col gap-1">
        {SIGNAL_PANELS.map(({ type, side, label }) => (
          <PlayheadOverlay
            key={`${side}-${type}`}
            playPct={playPct}
            label={label}
            className="min-h-0 flex-1"
          >
            <SignalChartMock
              type={type}
              side={side}
              compact
              data={signalSeries[type]}
              totalFrames={totalFrames}
            />
          </PlayheadOverlay>
        ))}
      </div>

      <CameraSwapArea playPct={playPct} />

      <PlayheadOverlay
        playPct={playPct}
        label="URDF 3D 仿真"
        showPlayhead={false}
        className="h-full min-h-0 min-w-0 flex-1"
      >
        <UrdfTrajectoryMock />
      </PlayheadOverlay>
    </div>
  )
}
