export type InterfaceTopologySection = {
  description: string
  id: string
  name: string
  scope: string
  technicalName: string
}

export type InterfaceTopologyRegionProps = {
  'data-ito-highlighted': boolean
  'data-ito-section': string
}

export type InterfaceTopologyController = {
  close: () => void
  highlightClassName: (id: string) => string
  inspect: (id: string) => void
  labelsVisible: boolean
  open: boolean
  regionProps: (id: string) => InterfaceTopologyRegionProps
  sections: readonly InterfaceTopologySection[]
  selected: string
  select: (id: string) => void
  toggleHighlight: () => void
  toggleLabels: () => void
  toggleOpen: () => void
  highlighting: boolean
}
