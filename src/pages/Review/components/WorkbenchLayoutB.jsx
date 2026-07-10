import PlayheadOverlay from './PlayheadOverlay'
import CameraSwapPanel from './CameraSwapPanel'
import UrdfTrajectoryMock from './UrdfTrajectoryMock'
import SignalChartMock from './SignalChartMock'

const SIGNAL_PANELS = [
  { type: 'joint', side: 'left', label: '左臂关节' },
  { type: 'joint', side: 'right', label: '右臂关节' },
  { type: 'pose', side: 'left', label: '左末端位姿' },
  { type: 'pose', side: 'right', label: '右末端位姿' },
  { type: 'gripper', side: 'both', label: '夹爪 (左+右)' },
]

/** 布局 B：左 5 张信号图 · 中图像互换 · 右 URDF */
export default function WorkbenchLayoutB({ playPct, signalSeries, totalFrames }) {
  return (
    <div className="flex min-h-0 flex-1 gap-2">
      <div className="flex h-full w-[184px] shrink-0 flex-col gap-1">
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
              showAxes
              data={signalSeries[type]}
              totalFrames={totalFrames}
            />
          </PlayheadOverlay>
        ))}
      </div>

      <CameraSwapPanel playPct={playPct} variant="stack" />

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
