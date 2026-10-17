import { ArrowUpRight } from "lucide-react";

export function PortalJourney() {
  return (
    <section className="tc-container tc-sourcing-journey" aria-labelledby="sourcing-journey">
      <div className="tc-journey-intro">
        <span className="tc-eyebrow">LESS SEARCHING. MORE POSSIBILITY.</span>
        <h2 id="sourcing-journey">
          From first hello
          <br />
          to <em>what’s next.</em>
        </h2>
        <p>
          A fabric sample. A production partner. A better quotation. Give your next textile project
          a clearer starting point.
        </p>
        <a className="tc-text-link" href="/register/buyer">
          Start your sourcing journey <ArrowUpRight size={18} />
        </a>
      </div>
      <ol className="tc-journey-steps">
        <li>
          <span>01 / DISCOVER</span>
          <h3>Find your specialist.</h3>
          <p>
            Explore yarn, fabric, garments and services. Search by capability and location to build
            your shortlist.
          </p>
        </li>
        <li>
          <span>02 / CONNECT</span>
          <h3>Make the brief matter.</h3>
          <p>
            Share your blend, GSM, quantity and delivery needs. Send a product enquiry or post a
            buyer requirement.
          </p>
        </li>
        <li>
          <span>03 / COMPARE</span>
          <h3>See the whole offer.</h3>
          <p>
            Compare price, tax, delivery and payment terms. Keep questions and seller replies
            together in your private conversations.
          </p>
        </li>
      </ol>
    </section>
  );
}
