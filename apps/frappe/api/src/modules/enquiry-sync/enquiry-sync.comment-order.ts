import type { FrappeJobComment } from "../connection/index.js";

export function orderEnquiryJobComments(comments: FrappeJobComment[]) {
  const byName = new Map(comments.map((comment) => [comment.name, comment]));
  const visiting = new Set<string>();
  const done = new Set<string>();
  const ordered: FrappeJobComment[] = [];
  const visit = (comment: FrappeJobComment) => {
    if (done.has(comment.name)) return;
    if (visiting.has(comment.name)) throw new Error("Frappe comment reply links contain a cycle.");
    visiting.add(comment.name);
    const parent = comment.parent_comment ? byName.get(comment.parent_comment) : undefined;
    if (parent) visit(parent);
    visiting.delete(comment.name);
    done.add(comment.name);
    ordered.push(comment);
  };
  for (const comment of comments) visit(comment);
  return ordered;
}
