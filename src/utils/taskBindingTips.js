export function boundEditTip(entityName) {
  const name = entityName?.trim() || '该项'
  return `${name}已绑定任务，无法编辑`
}

export function boundDeleteTip(entityName) {
  const name = entityName?.trim() || '该项'
  return `${name}已绑定任务，无法删除`
}
