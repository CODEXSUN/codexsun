import { Button } from "@codexsun/ui/components/button";
import type { TransferSession } from "./transfer-session.types.js";
export function SavedGroupImports({
  sessions,
  onResume
}: {
  sessions: TransferSession[];
  onResume: (stage: number, id: string) => void;
}) {
  return (
    <section className="mt-5 border-t pt-4">
      <h2 className="mb-2 font-semibold">Saved mappings</h2>
      {sessions.length ? (
        <div className="overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted">
              <tr>
                {["Source table", "Target table", "Status", "Action"].map((text) => (
                  <th className="p-3" key={text}>
                    {text}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sessions.map((item) => (
                <tr className="border-b" key={item.id}>
                  <td className="p-3">{item.sourceTable || "Not selected"}</td>
                  <td className="p-3">{item.targetTable || "Not selected"}</td>
                  <td className="p-3">{item.status}</td>
                  <td className="p-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onResume(item.stage, item.id)}
                    >
                      Open
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No saved mappings for this connection.</p>
      )}
    </section>
  );
}
