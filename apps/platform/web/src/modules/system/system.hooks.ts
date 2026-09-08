import { useQuery } from '@tanstack/react-query'
import { getSystemRuntime } from './system.services'

export function useSystemRuntime() {
  return useQuery({
    queryFn: ({ signal }) => getSystemRuntime(signal),
    queryKey: ['system', 'runtime'],
    retry: 1,
  })
}
