import PlayheadOverlay from './PlayheadOverlay'
import CameraMock from './CameraMock'
import UrdfTrajectoryMock from './UrdfTrajectoryMock'
import SignalChartMock from './SignalChartMock'

/** 布局 A：相机 + URDF 在上，三列信号图在下（原有布局，保持不变） */
export default function WorkbenchLayoutA({ playPct, signalSeries, totalFrames }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex min-h-0 flex-[3] gap-2">
        <PlayheadOverlay playPct={playPct} label="头部 · 主视角" showPlayhead={false} className="h-full min-h-0 min-w-0 flex-[2]">
          <CameraMock view="head" />
        </PlayheadOverlay>
        <div className="flex h-full min-h-0 min-w-0 flex-[1] flex-col gap-1">
          <PlayheadOverlay playPct={playPct} label="胸部" showPlayhead={false} className="min-h-0 flex-1">
            <CameraMock view="chest" />
          </PlayheadOverlay>
          <PlayheadOverlay playPct={playPct} label="左腕" showPlayhead={false} className="min-h-0 flex-1">
            <CameraMock view="leftWrist" />
          </PlayheadOverlay>
          <PlayheadOverlay playPct={playPct} label="右腕" showPlayhead={false} className="min-h-0 flex-1">
            <CameraMock view="rightWrist" />
          </PlayheadOverlay>
        </div>
        <PlayheadOverlay playPct={playPct} label="URDF 3D 轨迹" showPlayhead={false} className="h-full min-h-0 min-w-0 flex-[1]">
          <UrdfTrajectoryMock />
        </PlayheadOverlay>
      </div>

      <div className="flex min-h-0 flex-1 gap-2">
        <PlayheadOverlay playPct={playPct} label="关节 (左+右)" className="h-full min-h-0 min-w-0 flex-1">
          <SignalChartMock type="joint" data={signalSeries.joint} totalFrames={totalFrames} />
        </PlayheadOverlay>
        <PlayheadOverlay playPct={playPct} label="末端位姿 (左+右)" className="h-full min-h-0 min-w-0 flex-1">
          <SignalChartMock type="pose" data={signalSeries.pose} totalFrames={totalFrames} />
        </PlayheadOverlay>
        <PlayheadOverlay playPct={playPct} label="夹爪 (左+右)" className="h-full min-h-0 min-w-0 flex-1">
          <SignalChartMock type="gripper" data={signalSeries.gripper} totalFrames={totalFrames} />
        </PlayheadOverlay>
      </div>
    </div>
  )
}
