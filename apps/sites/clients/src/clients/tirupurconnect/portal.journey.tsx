import { useTextileContent } from "./portal.content";
export function PortalJourney() {
  const { journey } = useTextileContent();
  return (
    <section className="tc-container tc-sourcing-journey" aria-labelledby="sourcing-journey">
      <div className="tc-journey-intro">
        <span className="tc-eyebrow">{journey.label}</span>
        <h2 id="sourcing-journey">
          {journey.title}
          <br />
          <em>{journey.emphasis}</em>
        </h2>
        <p>{journey.intro}</p>
        <a className="tc-text-link" href="/register/buyer">
          Start your sourcing journey ↗
        </a>
      </div>
      <ol className="tc-journey-steps">
        {journey.items.map((item, index) => (
          <li key={index}>
            <span>
              0{index + 1} / {["DISCOVER", "CONNECT", "COMPARE"][index]}
            </span>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
