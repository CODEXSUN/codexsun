import { lazy, Suspense } from "react";
import type { UiComponentDoc } from "./ui-components";
import type { UiComponentVariantId } from "./component-variants";

const ActionsSpecimen = lazy(() =>
  import("./component-specimen-actions").then(({ ActionsSpecimen }) => ({ default: ActionsSpecimen })),
);
const DataSpecimen = lazy(() =>
  import("./component-specimen-data").then(({ DataSpecimen }) => ({ default: DataSpecimen })),
);
const FormsSpecimen = lazy(() =>
  import("./component-specimen-forms").then(({ FormsSpecimen }) => ({ default: FormsSpecimen })),
);
const NavigationSpecimen = lazy(() =>
  import("./component-specimen-navigation").then(({ NavigationSpecimen }) => ({ default: NavigationSpecimen })),
);
const OverlaysSpecimen = lazy(() =>
  import("./component-specimen-overlays").then(({ OverlaysSpecimen }) => ({ default: OverlaysSpecimen })),
);

export function ComponentSpecimen({
  compact = false,
  component,
  variant,
}: {
  compact?: boolean;
  component: UiComponentDoc;
  variant: UiComponentVariantId;
}) {
  const props = { componentId: component.id, compact };

  if (component.category === "Forms")
    return (
      <Suspense fallback={<SpecimenLoading />}>
        <FormsSpecimen {...props} />
      </Suspense>
    );
  if (component.category === "Overlays")
    return (
      <Suspense fallback={<SpecimenLoading />}>
        <OverlaysSpecimen {...props} />
      </Suspense>
    );
  if (component.category === "Navigation") {
    return (
      <Suspense fallback={<SpecimenLoading />}>
        <NavigationSpecimen {...props} variant={variant} />
      </Suspense>
    );
  }
  if (component.category === "Data display" || component.category === "Layout") {
    return (
      <Suspense fallback={<SpecimenLoading />}>
        <DataSpecimen {...props} />
      </Suspense>
    );
  }
  return (
    <Suspense fallback={<SpecimenLoading />}>
      <ActionsSpecimen {...props} />
    </Suspense>
  );
}

function SpecimenLoading() {
  return <div aria-label="Loading component preview" className="h-24" role="status" />;
}
