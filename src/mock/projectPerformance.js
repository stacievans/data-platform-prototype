/** 项目绩效统计 mock（采集 / 标注 / 验收） */

function withIds(prefix, rows) {
  return rows.map((row, i) => ({ id: `${prefix}-${i + 1}`, ...row }))
}

const P1001_PROJECT = {
  collect: withIds('pc', [
    { username: 'liuwei', nickname: '刘伟', collectTotalCount: 52, collectTotalDuration: 14.6, acceptPassCount: 46, acceptPassDuration: 13.1 },
    { username: 'zhoujie', nickname: '周杰', collectTotalCount: 48, collectTotalDuration: 13.2, acceptPassCount: 41, acceptPassDuration: 11.8 },
    { username: 'qianlin', nickname: '钱琳', collectTotalCount: 36, collectTotalDuration: 9.8, acceptPassCount: 32, acceptPassDuration: 8.9 },
    { username: 'wulei', nickname: '吴磊', collectTotalCount: 44, collectTotalDuration: 12.1, acceptPassCount: 38, acceptPassDuration: 10.5 },
    { username: 'xuyan', nickname: '徐燕', collectTotalCount: 28, collectTotalDuration: 7.4, acceptPassCount: 24, acceptPassDuration: 6.6 },
    { username: 'zhenghao', nickname: '郑浩', collectTotalCount: 31, collectTotalDuration: 8.5, acceptPassCount: 27, acceptPassDuration: 7.3 },
    { username: 'liming', nickname: '李明', collectTotalCount: 18, collectTotalDuration: 4.2, acceptPassCount: 16, acceptPassDuration: 3.8 },
  ]),
  review: withIds('pr', [
    { username: 'sunli', nickname: '孙丽', reviewTotalCount: 86, reviewTotalDuration: 42.5, reviewTotalTags: 1240, reviewTotalStages: 312, acceptPassTotalCount: 72, acceptPassTotalDuration: 35.8, acceptPassTotalTags: 980, acceptPassTotalStages: 248 },
    { username: 'wulei', nickname: '吴磊', reviewTotalCount: 64, reviewTotalDuration: 31.2, reviewTotalTags: 890, reviewTotalStages: 228, acceptPassTotalCount: 55, acceptPassTotalDuration: 26.4, acceptPassTotalTags: 720, acceptPassTotalStages: 196 },
    { username: 'qianlin', nickname: '钱琳', reviewTotalCount: 58, reviewTotalDuration: 28.6, reviewTotalTags: 810, reviewTotalStages: 205, acceptPassTotalCount: 49, acceptPassTotalDuration: 24.1, acceptPassTotalTags: 650, acceptPassTotalStages: 172 },
    { username: 'zhenghao', nickname: '郑浩', reviewTotalCount: 45, reviewTotalDuration: 22.0, reviewTotalTags: 620, reviewTotalStages: 158, acceptPassTotalCount: 38, acceptPassTotalDuration: 18.6, acceptPassTotalTags: 510, acceptPassTotalStages: 132 },
    { username: 'hemin', nickname: '何敏', reviewTotalCount: 22, reviewTotalDuration: 10.8, reviewTotalTags: 280, reviewTotalStages: 72, acceptPassTotalCount: 18, acceptPassTotalDuration: 8.9, acceptPassTotalTags: 220, acceptPassTotalStages: 58 },
    { username: 'wangfang', nickname: '王芳', reviewTotalCount: 15, reviewTotalDuration: 7.2, reviewTotalTags: 190, reviewTotalStages: 48, acceptPassTotalCount: 12, acceptPassTotalDuration: 5.8, acceptPassTotalTags: 150, acceptPassTotalStages: 38 },
  ]),
  accept: withIds('pa', [
    { username: 'chenjing', nickname: '陈静', acceptTotalCount: 120, acceptTotalDuration: 18.6, acceptTotalTags: 1680, acceptTotalStages: 420, acceptPassTotalCount: 108, acceptPassTotalDuration: 16.8, acceptPassTotalTags: 1520, acceptPassTotalStages: 380 },
    { username: 'linfeng', nickname: '林峰', acceptTotalCount: 98, acceptTotalDuration: 15.2, acceptTotalTags: 1370, acceptTotalStages: 342, acceptPassTotalCount: 86, acceptPassTotalDuration: 13.4, acceptPassTotalTags: 1210, acceptPassTotalStages: 302 },
    { username: 'chenwei', nickname: '陈伟', acceptTotalCount: 76, acceptTotalDuration: 11.8, acceptTotalTags: 1050, acceptTotalStages: 268, acceptPassTotalCount: 68, acceptPassTotalDuration: 10.5, acceptPassTotalTags: 940, acceptPassTotalStages: 236 },
    { username: 'liming', nickname: '李明', acceptTotalCount: 42, acceptTotalDuration: 6.4, acceptTotalTags: 580, acceptTotalStages: 145, acceptPassTotalCount: 36, acceptPassTotalDuration: 5.5, acceptPassTotalTags: 490, acceptPassTotalStages: 122 },
    { username: 'zhanghua', nickname: '张华', acceptTotalCount: 28, acceptTotalDuration: 4.2, acceptTotalTags: 390, acceptPassTotalStages: 98, acceptPassTotalCount: 24, acceptPassTotalDuration: 3.6, acceptPassTotalTags: 330, acceptPassTotalStages: 82 },
  ]),
}

const BATCH_PERF = {
  'BT-001': {
    collect: withIds('bc1', [
      { username: 'liuwei', nickname: '刘伟', collectTotalCount: 12, collectTotalDuration: 3.4, acceptPassCount: 11, acceptPassDuration: 3.1 },
      { username: 'zhoujie', nickname: '周杰', collectTotalCount: 10, collectTotalDuration: 2.8, acceptPassCount: 9, acceptPassDuration: 2.5 },
      { username: 'qianlin', nickname: '钱琳', collectTotalCount: 8, collectTotalDuration: 2.1, acceptPassCount: 7, acceptPassDuration: 1.9 },
      { username: 'wulei', nickname: '吴磊', collectTotalCount: 6, collectTotalDuration: 1.6, acceptPassCount: 5, acceptPassDuration: 1.4 },
    ]),
    review: withIds('br1', [
      { username: 'sunli', nickname: '孙丽', reviewTotalCount: 22, reviewTotalDuration: 11.2, reviewTotalTags: 320, reviewTotalStages: 82, acceptPassTotalCount: 18, acceptPassTotalDuration: 9.1, acceptPassTotalTags: 260, acceptPassTotalStages: 68 },
      { username: 'wulei', nickname: '吴磊', reviewTotalCount: 18, reviewTotalDuration: 9.0, reviewTotalTags: 250, reviewTotalStages: 64, acceptPassTotalCount: 15, acceptPassTotalDuration: 7.5, acceptPassTotalTags: 210, acceptPassTotalStages: 54 },
      { username: 'qianlin', nickname: '钱琳', reviewTotalCount: 14, reviewTotalDuration: 7.1, reviewTotalTags: 198, reviewTotalStages: 50, acceptPassTotalCount: 12, acceptPassTotalDuration: 6.0, acceptPassTotalTags: 168, acceptPassTotalStages: 42 },
    ]),
    accept: withIds('ba1', [
      { username: 'chenjing', nickname: '陈静', acceptTotalCount: 28, acceptTotalDuration: 4.2, acceptTotalTags: 390, acceptTotalStages: 98, acceptPassTotalCount: 25, acceptPassTotalDuration: 3.8, acceptPassTotalTags: 350, acceptPassTotalStages: 88 },
      { username: 'linfeng', nickname: '林峰', acceptTotalCount: 24, acceptTotalDuration: 3.6, acceptTotalTags: 340, acceptTotalStages: 85, acceptPassTotalCount: 21, acceptPassTotalDuration: 3.2, acceptPassTotalTags: 298, acceptPassTotalStages: 74 },
    ]),
  },
  'BT-002': {
    collect: withIds('bc2', [
      { username: 'zhoujie', nickname: '周杰', collectTotalCount: 22, collectTotalDuration: 6.1, acceptPassCount: 18, acceptPassDuration: 5.0 },
      { username: 'zhenghao', nickname: '郑浩', collectTotalCount: 19, collectTotalDuration: 5.3, acceptPassCount: 15, acceptPassDuration: 4.2 },
      { username: 'xuyan', nickname: '徐燕', collectTotalCount: 16, collectTotalDuration: 4.4, acceptPassCount: 12, acceptPassDuration: 3.3 },
    ]),
    review: withIds('br2', [
      { username: 'sunli', nickname: '孙丽', reviewTotalCount: 32, reviewTotalDuration: 16.0, reviewTotalTags: 460, reviewTotalStages: 118, acceptPassTotalCount: 26, acceptPassTotalDuration: 13.0, acceptPassTotalTags: 380, acceptPassTotalStages: 96 },
      { username: 'zhenghao', nickname: '郑浩', reviewTotalCount: 24, reviewTotalDuration: 12.2, reviewTotalTags: 340, reviewTotalStages: 86, acceptPassTotalCount: 20, acceptPassTotalDuration: 10.1, acceptPassTotalTags: 285, acceptPassTotalStages: 72 },
    ]),
    accept: withIds('ba2', [
      { username: 'linfeng', nickname: '林峰', acceptTotalCount: 36, acceptTotalDuration: 5.5, acceptTotalTags: 510, acceptTotalStages: 128, acceptPassTotalCount: 30, acceptPassTotalDuration: 4.6, acceptPassTotalTags: 420, acceptPassTotalStages: 105 },
      { username: 'chenwei', nickname: '陈伟', acceptTotalCount: 28, acceptTotalDuration: 4.3, acceptTotalTags: 390, acceptTotalStages: 98, acceptPassTotalCount: 22, acceptPassTotalDuration: 3.4, acceptPassTotalTags: 310, acceptPassTotalStages: 78 },
    ]),
  },
  'BT-003': {
    collect: withIds('bc3', [
      { username: 'liuwei', nickname: '刘伟', collectTotalCount: 14, collectTotalDuration: 3.9, acceptPassCount: 10, acceptPassDuration: 2.8 },
      { username: 'wulei', nickname: '吴磊', collectTotalCount: 11, collectTotalDuration: 3.0, acceptPassCount: 8, acceptPassDuration: 2.2 },
    ]),
    review: withIds('br3', [
      { username: 'wulei', nickname: '吴磊', reviewTotalCount: 20, reviewTotalDuration: 10.0, reviewTotalTags: 280, reviewTotalStages: 70, acceptPassTotalCount: 14, acceptPassTotalDuration: 7.0, acceptPassTotalTags: 195, acceptPassTotalStages: 49 },
      { username: 'wangfang', nickname: '王芳', reviewTotalCount: 12, reviewTotalDuration: 6.0, reviewTotalTags: 165, reviewTotalStages: 42, acceptPassTotalCount: 9, acceptPassTotalDuration: 4.5, acceptPassTotalTags: 120, acceptPassTotalStages: 30 },
    ]),
    accept: withIds('ba3', [
      { username: 'chenjing', nickname: '陈静', acceptTotalCount: 18, acceptTotalDuration: 2.8, acceptTotalTags: 250, acceptTotalStages: 62, acceptPassTotalCount: 11, acceptPassTotalDuration: 1.7, acceptPassTotalTags: 152, acceptPassTotalStages: 38 },
    ]),
  },
}

const EMPTY_STATS = { collect: [], review: [], accept: [] }

const PROJECT_STATS = {
  'P-1001': P1001_PROJECT,
  'P-1002': {
    collect: withIds('p2c', [
      { username: 'xuyan', nickname: '徐燕', collectTotalCount: 34, collectTotalDuration: 9.2, acceptPassCount: 30, acceptPassDuration: 8.1 },
      { username: 'liuwei', nickname: '刘伟', collectTotalCount: 26, collectTotalDuration: 7.1, acceptPassCount: 22, acceptPassDuration: 6.0 },
      { username: 'zhoujie', nickname: '周杰', collectTotalCount: 22, collectTotalDuration: 6.0, acceptPassCount: 19, acceptPassDuration: 5.2 },
      { username: 'chengong', nickname: '陈工', collectTotalCount: 15, collectTotalDuration: 4.1, acceptPassCount: 13, acceptPassDuration: 3.6 },
      { username: 'liming', nickname: '李明', collectTotalCount: 12, collectTotalDuration: 3.2, acceptPassCount: 10, acceptPassDuration: 2.7 },
    ]),
    review: withIds('p2r', [
      { username: 'sunli', nickname: '孙丽', reviewTotalCount: 40, reviewTotalDuration: 20.0, reviewTotalTags: 560, reviewTotalStages: 140, acceptPassTotalCount: 34, acceptPassTotalDuration: 17.0, acceptPassTotalTags: 470, acceptPassTotalStages: 118 },
      { username: 'qianlin', nickname: '钱琳', reviewTotalCount: 32, reviewTotalDuration: 16.0, reviewTotalTags: 450, reviewTotalStages: 112, acceptPassTotalCount: 28, acceptPassTotalDuration: 14.0, acceptPassTotalTags: 390, acceptPassTotalStages: 98 },
      { username: 'wulei', nickname: '吴磊', reviewTotalCount: 24, reviewTotalDuration: 12.0, reviewTotalTags: 330, reviewTotalStages: 82, acceptPassTotalCount: 20, acceptPassTotalDuration: 10.0, acceptPassTotalTags: 275, acceptPassTotalStages: 68 },
    ]),
    accept: withIds('p2a', [
      { username: 'linfeng', nickname: '林峰', acceptTotalCount: 52, acceptTotalDuration: 8.0, acceptTotalTags: 720, acceptTotalStages: 180, acceptPassTotalCount: 46, acceptPassTotalDuration: 7.1, acceptPassTotalTags: 640, acceptPassTotalStages: 160 },
      { username: 'chenjing', nickname: '陈静', acceptTotalCount: 44, acceptTotalDuration: 6.8, acceptTotalTags: 610, acceptTotalStages: 152, acceptPassTotalCount: 38, acceptPassTotalDuration: 5.9, acceptPassTotalTags: 520, acceptPassTotalStages: 130 },
    ]),
  },
}

export function getProjectPerformanceStats(projectId, batchTaskId = null) {
  if (batchTaskId) {
    return BATCH_PERF[batchTaskId] ?? EMPTY_STATS
  }
  return PROJECT_STATS[projectId] ?? EMPTY_STATS
}

export function sumPerformanceRows(rows, numericKeys) {
  const totals = { username: '总计', nickname: '总计', _isTotal: true, id: '__total__' }
  numericKeys.forEach((key) => {
    totals[key] = rows.reduce((sum, row) => sum + (Number(row[key]) || 0), 0)
  })
  return totals
}
