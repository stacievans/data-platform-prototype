import headImg from '../../../assets/review/camera-head.png'
import chestImg from '../../../assets/review/camera-chest.png'
import leftWristImg from '../../../assets/review/camera-left-wrist.png'
import rightWristImg from '../../../assets/review/camera-right-wrist.png'

const VIEW_IMAGES = {
  head: headImg,
  chest: chestImg,
  leftWrist: leftWristImg,
  rightWrist: rightWristImg,
}

export default function CameraMock({ view = 'head' }) {
  const src = VIEW_IMAGES[view] ?? headImg

  return (
    <img
      src={src}
      alt=""
      className="h-full w-full object-cover"
      draggable={false}
    />
  )
}
