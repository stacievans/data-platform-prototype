import { formatReviewer } from '../../mock/tasks'

export function resolveReviewOperator(entry, task) {
  return entry.reviewOperator ?? {
    nickname: formatReviewer(task?.reviewer) === '—' ? '孙丽' : formatReviewer(task.reviewer),
    id: 'U-2001',
  }
}

export function resolveAcceptOperator(entry) {
  return entry.acceptOperator ?? { nickname: '陈静', id: 'U-2002' }
}
