import { useEffect, useState } from 'react'

import { defaultMdiFeatures, type MdiFeatureKey, type MdiFeatures } from './mdi-types'

export function useMdiFeatures(
  applicationId: string,
  defaults: Partial<MdiFeatures> = {},
): [MdiFeatures, (feature: MdiFeatureKey, enabled: boolean) => void] {
  const storageKey = `codexsun.ui.mdi.features.${applicationId}`
  const [features, setFeatures] = useState<MdiFeatures>(() =>
    readFeatures(storageKey, { ...defaultMdiFeatures, ...defaults }),
  )

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(features))
  }, [features, storageKey])

  function setFeature(feature: MdiFeatureKey, enabled: boolean): void {
    setFeatures((current) => ({ ...current, [feature]: enabled }))
  }

  return [features, setFeature]
}

function readFeatures(storageKey: string, defaults: MdiFeatures): MdiFeatures {
  if (typeof window === 'undefined') return defaults

  try {
    const stored = JSON.parse(
      window.localStorage.getItem(storageKey) ?? '{}',
    ) as Partial<MdiFeatures>
    return { ...defaults, ...stored }
  } catch {
    return defaults
  }
}
