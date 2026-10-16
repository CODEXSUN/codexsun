import ProjectCaseRoom from "../components/ProjectCaseRoom";
import { WORK_ITEMS } from "../public.constants";
import "../public-site.css";

export function WorkPage({ id }: { id: string }) {
  const item = WORK_ITEMS.find((entry) => entry.slug === id);

  if (!item) {
    return (
      <div className="codexsun-public-site public-not-found">
        <a href="/#work">&larr; Selected work</a>
        <h1>Project not found.</h1>
      </div>
    );
  }

  const nextProject = WORK_ITEMS.find((entry) => entry.slug !== item.slug) ?? null;
  return <ProjectCaseRoom item={item} nextProject={nextProject} />;
}
