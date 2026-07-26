import { useAsync } from './useAsync'
import { getMarketContext } from '../services/market.service'

export function useMarketContext() {
  return useAsync(() => getMarketContext(), [])
}
