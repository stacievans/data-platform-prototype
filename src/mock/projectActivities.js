/** 项目活动记录 mock */
export const ACTIVITY_PROGRESS_OPTIONS = ['进行中', '完成', '失败']

export const ACTIVITY_TYPE_OPTIONS = [
  '批量创建批次任务',
  '添加数据',
  '分配人员',
  '预标注结果导入',
  '批量流转',
]

const projectActivities = [
  {
    id: 'AL-6001',
    projectId: 'P-1001',
    type: '批量创建批次任务',
    progress: '完成',
    executor: '李明',
    relatedTask: '客厅杂物分拣-第1批、卧室物品归位采集',
    createdAt: '2026-06-01 09:12:00',
    updatedAt: '2026-06-01 09:18:32',
    detail: {
      createdTasks: ['客厅杂物分拣-第1批 (T-2001)', '卧室物品归位采集 (T-2003)'],
    },
  },
  {
    id: 'AL-6002',
    projectId: 'P-1001',
    type: '添加数据',
    progress: '完成',
    executor: '王芳',
    relatedTask: '客厅杂物分拣-第2批',
    createdAt: '2026-06-02 14:05:00',
    updatedAt: '2026-06-02 14:22:11',
    detail: {
      addedCount: 128,
    },
  },
  {
    id: 'AL-6003',
    projectId: 'P-1001',
    type: '分配人员',
    progress: '进行中',
    executor: '陈伟',
    relatedTask: '螺钉锁附-M4工位',
    createdAt: '2026-06-10 11:30:00',
    updatedAt: '2026-06-18 16:40:00',
    detail: {
      assignments: [
        { name: '孙丽', role: '标注员' },
        { name: '陈静', role: '验收员' },
      ],
    },
  },
  {
    id: 'AL-6004',
    projectId: 'P-1001',
    type: '预标注结果导入',
    progress: '失败',
    executor: '孙丽',
    relatedTask: '螺钉锁附-M4工位',
    createdAt: '2026-06-12 08:45:00',
    updatedAt: '2026-06-12 08:52:19',
    detail: {
      successCount: 0,
      failCount: 45,
    },
  },
  {
    id: 'AL-6005',
    projectId: 'P-1001',
    type: '批量流转',
    progress: '完成',
    executor: '陈静',
    relatedTask: '客厅杂物分拣-第2批',
    createdAt: '2026-06-15 17:20:00',
    updatedAt: '2026-06-15 17:25:44',
    detail: {
      transferredCount: 210,
      fromStatus: '已标注',
      toStatus: '已验收',
    },
  },
  {
    id: 'AL-6006',
    projectId: 'P-1001',
    type: '批量流转',
    progress: '进行中',
    executor: '林峰',
    relatedTask: '螺钉锁附-M4工位',
    createdAt: '2026-06-18 10:00:00',
    updatedAt: '2026-06-18 10:00:00',
    detail: {
      transferredCount: 186,
      fromStatus: '已标注',
      toStatus: '已验收',
    },
  },
]

export function getProjectActivities(projectId) {
  if (!projectId) return []
  return projectActivities
    .filter((a) => a.projectId === projectId)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
}
