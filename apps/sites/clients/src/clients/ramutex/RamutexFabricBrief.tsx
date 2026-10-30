import { ArrowUpRight } from "lucide-react";
import { fabricCheckpoints } from "./ramutex-fabrics";

export function RamutexFabricBrief() {
  return (
    <section className="rt-fabric-brief">
      <div className="rt-wrap">
        <div className="rt-fabric-intro">
          <p className="rt-eyebrow">DETAILS THAT MAKE A DIFFERENCE</p>
          <h2>
            Define the fabric.
            <br />
            <em>Then define the result.</em>
          </h2>
          <p>
            A clear sample brief connects what you can see and feel with the measurements your
            garment needs.
          </p>
        </div>
        <div className="rt-fabric-checkpoints">
          {fabricCheckpoints.map((item, index) => (
            <article key={item.title}>
              <span>0{index + 1}</span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
        <div className="rt-fabric-request">
          <div>
            <h3>Bring your sample. Tell us the end use.</h3>
            <p>
              Include composition, construction, target GSM, usable width, shade reference, quantity
              and desired finish. Add a testing specification or reference garment if you have one.
            </p>
          </div>
          <a
            className="rt-button"
            href="/contact?service=Fabric%20sample%20and%20processing%20brief"
          >
            Start your fabric brief <ArrowUpRight size={18} />
          </a>
        </div>
        <p className="rt-fabric-test-note">
          Agree performance targets, sample approval and the test plan with the team, including any
          external laboratory requirements.
        </p>
        <nav className="rt-fabric-references" aria-label="Textile reference reading">
          <span>Further reading</span>
          <a
            href="https://cottonworks.com/learning-hub/knitting/single-and-double-knits/"
            target="_blank"
            rel="noreferrer"
          >
            Knit constructions · CottonWorks
          </a>
          <a href="https://members.aatcc.org/store/tm217/4012/" target="_blank" rel="noreferrer">
            Wicking assessment · AATCC
          </a>
          <a
            href="https://www.hohenstein.us/en-us/textile-testing/quality/textile-and-chemical-tests/"
            target="_blank"
            rel="noreferrer"
          >
            Textile testing · Hohenstein
          </a>
        </nav>
      </div>
    </section>
  );
}
