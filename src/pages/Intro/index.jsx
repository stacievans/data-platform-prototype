/** 使用 public 目录原图，避免构建压缩；按原始像素展示，防止被拉伸发糊 */
const INTRO_IMAGE = '/intro/data-collection-flow.png'
const INTRO_WIDTH = 701
const INTRO_HEIGHT = 1024

export default function IntroPage() {
  return (
    <div className="flex justify-center">
      <img
        src={INTRO_IMAGE}
        alt="真机数据采集全链路作业流程"
        width={INTRO_WIDTH}
        height={INTRO_HEIGHT}
        className="block h-auto max-w-full"
        draggable={false}
      />
    </div>
  )
}
