import {
  TopologyInspectionControl,
  TopologyInspector,
  TopologyMarker,
  useInterfaceTopology,
  type InterfaceTopologyController as SharedTopologyController,
  type InterfaceTopologySection
} from '@codexsun/ui/features/interface-topology';

export { TopologyInspectionControl, TopologyMarker };
export type { InterfaceTopologySection };

export type InterfaceTopologyController = SharedTopologyController & {
  rootAttributes: Record<string, never>;
};

export function useInterfaceTopologyOverlay(sections: readonly InterfaceTopologySection[]): InterfaceTopologyController {
  const controller = useInterfaceTopology([{ id: 'qcafe', name: 'Q Cafe', sections }]);
  return { ...controller, rootAttributes: {} };
}

export const InterfaceTopologyDrawer = TopologyInspector;
