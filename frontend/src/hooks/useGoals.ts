import { useAsync } from './useAsync'
import { getGoals } from '../services/goals.service'

export function useGoals() {
  return useAsync(() => getGoals(), [])
}
