import { useEffect, useState } from 'react'
import { api } from '../lib/api'

export function useApiQuery<T>(path: string) {
  const [version, setVersion] = useState(0)
  const key = `${path}:${version}`
  const [result, setResult] = useState<{
    key: string
    data?: T
    error?: string
  } | null>(null)
  useEffect(() => {
    let active = true
    api<T>(path, 'GET', undefined, true).then(
      (data) => {
        if (active) setResult({ key, data })
      },
      (error) => {
        if (active)
          setResult({
            key,
            error:
              error instanceof Error ? error.message : 'Không thể tải dữ liệu.',
          })
      },
    )
    return () => {
      active = false
    }
  }, [path, key])
  return {
    data: result?.key === key ? result.data : undefined,
    error: result?.key === key ? result.error : undefined,
    loading: result?.key !== key,
    retry: () => setVersion((value) => value + 1),
  }
}
