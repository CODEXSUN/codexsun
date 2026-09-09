type MermaidNode = { id: string; label: string }
type MermaidEdge = { from: string; label?: string; to: string }

export function renderMermaidFlowcharts(content: HTMLDivElement) {
  content.querySelectorAll('pre > code.language-mermaid').forEach((code) => {
    const pre = code.parentElement
    if (!pre) return

    const diagram = createFlowchart(code.textContent ?? '')
    if (diagram) {
      pre.replaceWith(diagram)
      return
    }

    const error = document.createElement('div')
    error.className = 'docs-mermaid-error'
    error.textContent =
      'Use Mermaid flowchart syntax such as “flowchart LR” and “A[Start] --> B[End]”.'
    pre.replaceWith(error)
  })
}

function createFlowchart(source: string): HTMLDivElement | undefined {
  const lines = source
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  const direction = lines
    .shift()
    ?.match(/^flowchart\s+(LR|RL|TB|TD)$/i)?.[1]
    ?.toUpperCase()
  if (!direction) return undefined

  const nodes = new Map<string, MermaidNode>()
  const edges = lines
    .map((line) => parseEdge(line, nodes))
    .filter((edge): edge is MermaidEdge => Boolean(edge))
  if (!edges.length) return undefined

  const wrapper = document.createElement('div')
  wrapper.className = 'docs-mermaid-diagram'
  wrapper.append(createSvg(nodes, edges, direction))
  return wrapper
}

function parseEdge(line: string, nodes: Map<string, MermaidNode>): MermaidEdge | undefined {
  const match = line.match(
    /^([\w-]+)(?:\[([^\]]+)\])?\s*(?:-->|-.\s*(.*?)\s*.->)\s*([\w-]+)(?:\[([^\]]+)\])?$/,
  )
  if (!match) return undefined

  const [, from, fromLabel, label, to, toLabel] = match
  nodes.set(from, { id: from, label: fromLabel?.trim() || from })
  nodes.set(to, { id: to, label: toLabel?.trim() || to })
  return { from, ...(label?.trim() ? { label: label.trim() } : {}), to }
}

function createSvg(
  nodes: Map<string, MermaidNode>,
  edges: MermaidEdge[],
  direction: string,
): SVGSVGElement {
  const graphNodes = [...nodes.values()]
  const ranks = getRanks(graphNodes, edges)
  const lanes = groupNodes(graphNodes, ranks)
  const horizontal = direction === 'LR' || direction === 'RL'
  const positions = getPositions(lanes, horizontal)
  const dimensions = getDimensions(lanes, horizontal)
  const svg = createElement('svg') as SVGSVGElement
  svg.setAttribute('aria-label', 'Mermaid flowchart')
  svg.setAttribute('role', 'img')
  svg.setAttribute('viewBox', `0 0 ${dimensions.width} ${dimensions.height}`)
  svg.append(createArrowMarker())

  edges.forEach((edge) => appendEdge(svg, edge, positions, horizontal))
  graphNodes.forEach((node) => appendNode(svg, node, positions.get(node.id)))
  return svg
}

function getRanks(nodes: MermaidNode[], edges: MermaidEdge[]): Map<string, number> {
  const ranks = new Map(nodes.map((node) => [node.id, 0]))
  for (let iteration = 0; iteration < nodes.length; iteration += 1) {
    edges.forEach((edge) => {
      ranks.set(edge.to, Math.max(ranks.get(edge.to) ?? 0, (ranks.get(edge.from) ?? 0) + 1))
    })
  }
  return ranks
}

function groupNodes(nodes: MermaidNode[], ranks: Map<string, number>): Map<number, MermaidNode[]> {
  const lanes = new Map<number, MermaidNode[]>()
  nodes.forEach((node) => {
    const lane = ranks.get(node.id) ?? 0
    lanes.set(lane, [...(lanes.get(lane) ?? []), node])
  })
  return lanes
}

function getPositions(lanes: Map<number, MermaidNode[]>, horizontal: boolean) {
  const positions = new Map<string, { x: number; y: number }>()
  ;[...lanes.entries()].forEach(([lane, laneNodes]) => {
    laneNodes.forEach((node, index) => {
      positions.set(
        node.id,
        horizontal
          ? { x: 36 + lane * 268, y: 36 + index * 96 }
          : { x: 36 + index * 268, y: 36 + lane * 96 },
      )
    })
  })
  return positions
}

function getDimensions(lanes: Map<number, MermaidNode[]>, horizontal: boolean) {
  const widestLane = Math.max(...[...lanes.values()].map((lane) => lane.length))
  const laneCount = lanes.size
  return horizontal
    ? { height: 72 + widestLane * 96, width: 72 + laneCount * 268 }
    : { height: 72 + laneCount * 96, width: 72 + widestLane * 268 }
}

function createArrowMarker(): SVGDefsElement {
  const definitions = createElement('defs') as SVGDefsElement
  const marker = createElement('marker')
  marker.id = 'docs-mermaid-arrow'
  marker.setAttribute('markerHeight', '7')
  marker.setAttribute('markerWidth', '7')
  marker.setAttribute('orient', 'auto')
  marker.setAttribute('refX', '6')
  marker.setAttribute('refY', '3.5')
  const arrow = createElement('path')
  arrow.setAttribute('d', 'M 0 0 L 7 3.5 L 0 7 z')
  arrow.setAttribute('fill', 'currentColor')
  marker.append(arrow)
  definitions.append(marker)
  return definitions
}

function appendEdge(
  svg: SVGSVGElement,
  edge: MermaidEdge,
  positions: Map<string, { x: number; y: number }>,
  horizontal: boolean,
) {
  const from = positions.get(edge.from)
  const to = positions.get(edge.to)
  if (!from || !to) return
  const line = createElement('line')
  line.setAttribute('marker-end', 'url(#docs-mermaid-arrow)')
  line.setAttribute('stroke', 'currentColor')
  line.setAttribute('stroke-width', '1.5')
  line.setAttribute('x1', String(horizontal ? from.x + 172 : from.x + 86))
  line.setAttribute('x2', String(horizontal ? to.x : to.x + 86))
  line.setAttribute('y1', String(horizontal ? from.y + 30 : from.y + 60))
  line.setAttribute('y2', String(horizontal ? to.y + 30 : to.y))
  svg.append(line)
  if (edge.label)
    svg.append(
      createText(edge.label, (from.x + to.x + 172) / 2, (from.y + to.y + 60) / 2 - 8, '11'),
    )
}

function appendNode(
  svg: SVGSVGElement,
  node: MermaidNode,
  position: { x: number; y: number } | undefined,
) {
  if (!position) return
  const rectangle = createElement('rect')
  rectangle.setAttribute('height', '60')
  rectangle.setAttribute('rx', '8')
  rectangle.setAttribute('width', '172')
  rectangle.setAttribute('x', String(position.x))
  rectangle.setAttribute('y', String(position.y))
  svg.append(rectangle)
  svg.append(createText(node.label, position.x + 86, position.y + 34, '12'))
}

function createElement(name: string): SVGElement {
  return document.createElementNS('http://www.w3.org/2000/svg', name)
}

function createText(label: string, x: number, y: number, size: string): SVGTextElement {
  const text = createElement('text') as SVGTextElement
  text.setAttribute('font-size', size)
  text.setAttribute('text-anchor', 'middle')
  text.setAttribute('x', String(x))
  text.setAttribute('y', String(y))
  text.textContent = label
  return text
}
