import {
  CommonTableListWorkspace,
  type CommonTableSelection
} from "./common-table-list.workspace.js";
import { TableImportReviewWorkspace } from "./table-import-review.workspace.js";

export function CommonTableImportWorkspace(
  props:
    | { view: "tables"; onOpenTable: (selection: CommonTableSelection) => void }
    | {
        view: "review";
        selection?: CommonTableSelection;
        onBack: () => void;
        onOpenSaved: (id: string) => void;
      }
) {
  if (props.view === "tables") {
    return <CommonTableListWorkspace onOpenTable={props.onOpenTable} />;
  }
  return (
    <TableImportReviewWorkspace
      {...(props.selection ? { selection: props.selection } : {})}
      onBack={props.onBack}
      onOpenSaved={props.onOpenSaved}
    />
  );
}
