/** TODO: 下一版接入 three.js URDF 三维渲染 */
import urdfImg from '../../../assets/review/urdf-robot.png'

export default function UrdfTrajectoryMock() {
  return (
    <img
      src={urdfImg}
      alt=""
      className="h-full w-full bg-black object-contain"
      draggable={false}
    />
  )
}
