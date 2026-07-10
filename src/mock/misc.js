// 标签管理 — 采集标签（按子 tab 分组）
export const collectTagGroups = {
  taskType: [
    { id: 'CT-101', name: '正式采集', description: '正式采集任务，计入统计和质检流程', creator: '张华', createdAt: '2026-03-10 00:00:00', updatedAt: '2026-03-10 00:00:00' },
    { id: 'CT-102', name: '试采集', description: '试验性采集，数据仅供内部参考，不计入正式指标', creator: '张华', createdAt: '2026-03-10 00:00:00', updatedAt: '2026-04-01 00:00:00' },
  ],
  sceneType: [
    { id: 'CT-201', name: '家居服务', description: '家庭室内环境下的机器人服务采集场景', creator: '李明', createdAt: '2026-03-12 00:00:00', updatedAt: '2026-03-12 00:00:00' },
    { id: 'CT-202', name: '工业服务', description: '工厂或仓库等工业环境下的操作采集场景', creator: '李明', createdAt: '2026-03-12 00:00:00', updatedAt: '2026-04-15 00:00:00' },
    { id: 'CT-203', name: '公共服务', description: '商场、餐厅等公共场所服务场景', creator: '王芳', createdAt: '2026-04-02 00:00:00', updatedAt: '2026-04-02 00:00:00' },
  ],
  collectionMethod: [
    { id: 'CT-301', name: 'VR遥操', description: '使用 VR 头显进行遥操作数据采集', creator: '张华', createdAt: '2026-03-15 00:00:00', updatedAt: '2026-03-15 00:00:00' },
    { id: 'CT-302', name: '外骨骼', description: '穿戴外骨骼同构臂进行示教数据采集', creator: '张华', createdAt: '2026-03-15 00:00:00', updatedAt: '2026-05-10 00:00:00' },
  ],
  atomicSkill: [
    { id: 'CT-401', name: 'close', description: '关闭动作，如关门、关抽屉', creator: '刘伟', createdAt: '2026-03-18 00:00:00', updatedAt: '2026-03-18 00:00:00' },
    { id: 'CT-402', name: 'open', description: '打开动作，如开门、开抽屉', creator: '刘伟', createdAt: '2026-03-18 00:00:00', updatedAt: '2026-03-18 00:00:00' },
    { id: 'CT-403', name: 'press', description: '按压动作，如按按钮、按开关', creator: '刘伟', createdAt: '2026-03-20 00:00:00', updatedAt: '2026-03-20 00:00:00' },
    { id: 'CT-404', name: 'grasp', description: '抓取动作，手爪或灵巧手夹持物体', creator: '周杰', createdAt: '2026-03-22 00:00:00', updatedAt: '2026-04-30 00:00:00' },
    { id: 'CT-405', name: 'push', description: '推送动作，将物体向前推移', creator: '周杰', createdAt: '2026-03-22 00:00:00', updatedAt: '2026-03-22 00:00:00' },
    { id: 'CT-406', name: 'pull', description: '拉取动作，将物体向后拉动', creator: '周杰', createdAt: '2026-03-22 00:00:00', updatedAt: '2026-03-22 00:00:00' },
    { id: 'CT-407', name: 'move', description: '移动动作，将物体搬运至目标位置', creator: '刘伟', createdAt: '2026-04-05 00:00:00', updatedAt: '2026-05-08 00:00:00' },
  ],
}

// 标注模板
export const annotationTemplates = [
  { id: 'AT-301', name: '桌面抓取标注模板', createdAt: '2026-03-18 00:00:00', updatedAt: '2026-04-20 00:00:00' },
  { id: 'AT-302', name: '导航避障模板', createdAt: '2026-03-26 00:00:00', updatedAt: '2026-03-26 00:00:00' },
  { id: 'AT-303', name: '回流标注模板', createdAt: '2026-05-01 00:00:00', updatedAt: '2026-05-14 00:00:00' },
]

// 兼容旧引用（部分页面可能还在 import）
export const collectTags = Object.values(collectTagGroups).flat()

// 设备管理 — 见 devices.js
export { devices } from './devices'

// 系统管理 - 用户
export const users = [
  { id: 1, uid: 'U-001', username: 'zhanghua',  nickname: '张华', phone: '138****2201', role: '管理员',   status: '启用', createdAt: '2026-03-01 09:00:00', lastLoginAt: '2026-06-18 09:15:00' },
  { id: 2, uid: 'U-002', username: 'liming',   nickname: '李明',   phone: '139****8512', role: '平台运营', status: '启用', createdAt: '2026-03-05 10:30:00', lastLoginAt: '2026-06-18 07:40:00' },
  { id: 3, uid: 'U-003', username: 'wangfang', nickname: '王芳',   phone: '136****3308', role: '平台运营', status: '启用', createdAt: '2026-03-08 14:20:00', lastLoginAt: '2026-06-17 16:22:00' },
  { id: 4, uid: 'U-004', username: 'liuwei',   nickname: '刘伟',   phone: '137****9914', role: '采集员',   status: '启用', createdAt: '2026-03-12 11:00:00', lastLoginAt: '2026-06-18 10:05:00' },
  { id: 5, uid: 'U-005', username: 'zhoujie',  nickname: '周杰',   phone: '135****6627', role: '采集员',   status: '启用', createdAt: '2026-03-15 09:45:00', lastLoginAt: '2026-06-16 08:30:00' },
  { id: 6, uid: 'U-006', username: 'sunli',    nickname: '孙丽',   phone: '188****4053', role: '标注员',   status: '启用', createdAt: '2026-03-18 13:10:00', lastLoginAt: '2026-06-15 14:18:00' },
  { id: 7, uid: 'U-007', username: 'hemin',    nickname: '何敏',   phone: '186****7740', role: '标注员',   status: '停用', createdAt: '2026-03-20 15:00:00', lastLoginAt: '2026-06-10 11:20:00' },
  { id: 8, uid: 'U-008', username: 'qianlin',  nickname: '钱琳',   phone: '158****1196', role: '标注员',   status: '启用', createdAt: '2026-03-22 10:25:00', lastLoginAt: '2026-06-18 06:50:00' },
  { id: 9, uid: 'U-009', username: 'zhaoyan',  nickname: '赵研',   phone: '133****8801', role: '游客',     status: '启用', createdAt: '2026-04-01 08:00:00', lastLoginAt: '2026-06-12 09:00:00' },
  { id: 10, uid: 'U-010', username: 'chengong', nickname: '陈工',   phone: '132****5566', role: '工程师',   status: '启用', createdAt: '2026-04-08 16:40:00', lastLoginAt: '2026-06-14 17:30:00' },
  { id: 11, uid: 'U-011', username: 'wulei',    nickname: '吴磊',   phone: '134****7788', role: '采集员&标注员', status: '启用', createdAt: '2026-04-12 09:15:00', lastLoginAt: '2026-06-18 08:20:00' },
  { id: 12, uid: 'U-012', username: 'zhenghao', nickname: '郑浩',   phone: '159****3321', role: '采集员&标注员', status: '启用', createdAt: '2026-04-20 11:30:00', lastLoginAt: '2026-06-11 13:45:00' },
  { id: 13, uid: 'U-013', username: 'linfang',  nickname: '林芳',   phone: '137****8899', role: '区域协调员',     status: '启用', createdAt: '2026-05-25 09:00:00', lastLoginAt: '2026-06-17 10:12:00' },
]

export const roleColor = {
  管理员: 'purple',
  平台运营: 'blue',
  采集员: 'cyan',
  标注员: 'orange',
  游客: 'green',
  工程师: 'indigo',
  数据审核员: 'purple',
  区域协调员: 'blue',
}

// 角色权限见 mock/rbac.js

// 系统日志 mock（15 条）
export const systemLogs = [
  { id: 'L-001', time: '2026-06-10 17:22:14', operator: '张华', module: '用户管理',   action: '新增', detail: '新增用户 liuwei（采集员）',                          ip: '192.168.1.10' },
  { id: 'L-002', time: '2026-06-10 16:58:03', operator: '李明',   module: '采集管理',   action: '创建', detail: '新建采集任务 T-2015（小物件精细抓取采集）',            ip: '192.168.1.21' },
  { id: 'L-003', time: '2026-06-10 16:30:47', operator: '张华', module: '设备管理',   action: '新增', detail: '新增设备 DEV-F01（SN: SN20260526K4452）',             ip: '192.168.1.10' },
  { id: 'L-004', time: '2026-06-10 15:44:22', operator: '王芳',   module: '采集管理',   action: '编辑', detail: '编辑项目 P-1003《工业零件装配采集》基本信息',          ip: '192.168.1.33' },
  { id: 'L-005', time: '2026-06-10 14:20:09', operator: '李明',   module: '数据集管理', action: '导出', detail: '导出真机数据集 DS-002《厨房精细操作数据集》标签文件',   ip: '192.168.1.21' },
  { id: 'L-006', time: '2026-06-10 13:55:31', operator: '张华', module: '标签管理',   action: '创建', detail: '新建原子技能标签 place（放置动作）',                   ip: '192.168.1.10' },
  { id: 'L-007', time: '2026-06-10 11:08:45', operator: '刘伟',   module: '采集管理',   action: '修改', detail: '更新任务 T-2002 采集进度至 386 条',                   ip: '192.168.2.55' },
  { id: 'L-008', time: '2026-06-10 10:30:12', operator: '李明',   module: '采集管理',   action: '创建', detail: '新建采集项目 P-1009《精细操作 v2 采集》',             ip: '192.168.1.21' },
  { id: 'L-009', time: '2026-06-09 18:12:58', operator: '张华', module: '用户管理',   action: '修改', detail: '修改用户 hemin 状态：停用 → 启用',                    ip: '192.168.1.10' },
  { id: 'L-010', time: '2026-06-09 16:40:33', operator: '王芳',   module: '标签管理',   action: '删除', detail: '删除采集方案标签「算法-旧版」',                        ip: '192.168.1.33' },
  { id: 'L-011', time: '2026-06-09 14:22:07', operator: '李明',   module: '数据集管理', action: '导入', detail: '导入开源数据集 RH20T（5,200 条轨迹）',                ip: '192.168.1.21' },
  { id: 'L-012', time: '2026-06-09 11:05:50', operator: '张华', module: '设备管理',   action: '编辑', detail: '编辑设备 DEV-C02 描述信息',                           ip: '192.168.1.10' },
  { id: 'L-013', time: '2026-06-08 17:34:21', operator: '吴磊',   module: '采集管理',   action: '删除', detail: '删除采集任务 T-2006（蔬菜切配-青椒块，状态：未开始）', ip: '192.168.2.78' },
  { id: 'L-014', time: '2026-06-08 15:18:44', operator: '李明',   module: '采集管理',   action: '下载', detail: '下载项目 P-1001 采集方案配置文件',                    ip: '192.168.1.21' },
  { id: 'L-015', time: '2026-06-07 10:02:19', operator: '张华', module: '用户管理',   action: '新增', detail: '新增用户 sunli（标注员）',                            ip: '192.168.1.10' },
]

export const logActionColor = {
  创建: 'blue', 编辑: 'cyan', 删除: 'red', 导入: 'purple',
  导出: 'green', 新增: 'blue', 修改: 'orange', 下载: 'gray',
}

// 项目成员 mock（按项目 ID 组织）
// roles 为项目级角色，可多个：采集员 / 标注员 / 平台运营
export const projectMembers = {
  'P-1001': [
    { id: 'PM-1001-1', name: '李明',   roles: ['平台运营'],           taskIds: [],                              joinedAt: '2026-03-10 09:00:00' },
    { id: 'PM-1001-2', name: '刘伟',   roles: ['采集员'],             taskIds: ['T-2001', 'T-2002'],            joinedAt: '2026-03-13 10:30:00' },
    { id: 'PM-1001-3', name: '周杰',   roles: ['采集员'],             taskIds: ['T-2003', 'T-2004'],            joinedAt: '2026-03-28 14:15:00' },
    { id: 'PM-1001-4', name: '孙丽',   roles: ['标注员'],             taskIds: ['T-2001', 'T-2002', 'T-2003'], joinedAt: '2026-03-13 11:20:00' },
    { id: 'PM-1001-5', name: '何敏',   roles: ['标注员'],             taskIds: ['T-2004'],                      joinedAt: '2026-03-28 16:45:00' },
  ],
  'P-1002': [
    { id: 'PM-1002-1', name: '王芳',   roles: ['平台运营'],           taskIds: [],                              joinedAt: '2026-03-20 08:30:00' },
    { id: 'PM-1002-2', name: '刘伟',   roles: ['采集员'],             taskIds: ['T-2007'],                      joinedAt: '2026-04-05 13:00:00' },
    { id: 'PM-1002-3', name: '何敏',   roles: ['标注员'],             taskIds: ['T-2005', 'T-2006'],            joinedAt: '2026-03-22 15:22:00' },
  ],
  'P-1003': [
    { id: 'PM-1003-1', name: '李明',   roles: ['平台运营'],           taskIds: [],                              joinedAt: '2026-04-01 09:10:00' },
    { id: 'PM-1003-2', name: '周杰',   roles: ['采集员'],             taskIds: ['T-2008', 'T-2009'],            joinedAt: '2026-04-03 10:05:00' },
    { id: 'PM-1003-3', name: '钱琳',   roles: ['标注员'],             taskIds: ['T-2008', 'T-2009', 'T-2010'], joinedAt: '2026-04-03 14:40:00' },
  ],
  'P-1004': [
    { id: 'PM-1004-1', name: '周杰',   roles: ['采集员'],             taskIds: ['T-2011', 'T-2012'],            joinedAt: '2026-04-15 11:30:00' },
    { id: 'PM-1004-2', name: '孙丽',   roles: ['标注员'],             taskIds: ['T-2011', 'T-2012'],            joinedAt: '2026-04-30 17:00:00' },
  ],
  'P-1005': [
    { id: 'PM-1005-1', name: '王芳',   roles: ['平台运营'],           taskIds: [],                              joinedAt: '2026-04-28 09:45:00' },
    { id: 'PM-1005-2', name: '刘伟',   roles: ['采集员'],             taskIds: ['T-2013'],                      joinedAt: '2026-04-30 10:15:00' },
    { id: 'PM-1005-3', name: '何敏',   roles: ['标注员'],             taskIds: ['T-2013'],                      joinedAt: '2026-04-30 16:50:00' },
  ],
  'P-1006': [
    { id: 'PM-1006-1', name: '孙丽',   roles: ['标注员'],             taskIds: ['T-2014'],                      joinedAt: '2026-05-11 08:20:00' },
    { id: 'PM-1006-2', name: '钱琳',   roles: ['标注员'],             taskIds: [],                              joinedAt: '2026-05-11 13:35:00' },
  ],
  'P-1007': [
    { id: 'PM-1007-1', name: '刘伟',   roles: ['采集员'],             taskIds: [],                              joinedAt: '2026-05-18 09:00:00' },
    { id: 'PM-1007-2', name: '钱琳',   roles: ['标注员'],             taskIds: [],                              joinedAt: '2026-05-18 11:25:00' },
  ],
  'P-1008': [
    { id: 'PM-1008-1', name: '李明',   roles: ['平台运营'],           taskIds: [],                              joinedAt: '2026-05-25 10:00:00' },
    { id: 'PM-1008-2', name: '刘伟',   roles: ['采集员'],             taskIds: ['T-2015'],                      joinedAt: '2026-05-27 14:30:00' },
    { id: 'PM-1008-3', name: '钱琳',   roles: ['标注员'],             taskIds: ['T-2015'],                      joinedAt: '2026-05-27 15:45:00' },
  ],
}
