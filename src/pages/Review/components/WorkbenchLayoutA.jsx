import PlayheadOverlay from './PlayheadOverlay'
import CameraSwapPanel from './CameraSwapPanel'
import UrdfTrajectoryMock from './UrdfTrajectoryMock'
import SignalChartMock from './SignalChartMock'

/** 布局 A：相机 + URDF 在上，三列信号图在下 */
export default function WorkbenchLayoutA({ playPct, signalSeries, totalFrames }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex min-h-0 flex-[3] gap-2">
        <CameraSwapPanel playPct={playPct} variant="side" />
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
