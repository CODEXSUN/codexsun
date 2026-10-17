import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { MenuImage } from "./menu.image";
import { getMenuDemo, importMenuDemo, type MenuDemoPack } from "./menu.services";
export function MenuDemo({ canManage }: { canManage: boolean }) {
  const [pack, setPack] = useState<MenuDemoPack | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [preview, setPreview] = useState(false);
  useEffect(() => {
    void getMenuDemo()
      .then(setPack)
      .catch((error) =>
        setError(error instanceof Error ? error.message : "Unable to load demo pack.")
      );
  }, []);
  async function install() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await importMenuDemo();
      setNotice(
        `${result.added} demo items added. ${result.skipped} existing demo items preserved. ${result.categories} categories in the demo pack.`
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to import demo content.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="qcafe-demo-section">
      <h2>South Indian demo menu</h2>
      <p>
        18 sample items in 5 categories, English and Tamil names, sample INR prices, and original
        illustrated food images. Demo items use DEMO- codes. Review prices before using them for
        sales.
      </p>
      <p>
        Import adds missing demo items to this tenant only. Existing menu items, edited demo items,
        bills and payments are preserved. Images are stored in this tenant’s QCafe Master folder.
      </p>
      {pack && <p>{pack.categories.join(" · ")}</p>}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setPreview(!preview)}
          disabled={!pack}
        >
          {preview ? "Hide preview" : "Preview demo menu"}
        </Button>
        <Button type="button" onClick={() => void install()} disabled={!canManage || busy || !pack}>
          <Download size={15} />
          {busy ? "Importing demo content…" : "Import South Indian demo menu"}
        </Button>
      </div>
      {error && (
        <p role="alert" className="qcafe-master-error">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="qcafe-master-notice">
          {notice}
        </p>
      )}
      {preview && (
        <div className="qcafe-demo-grid">
          {pack?.items.map((item) => (
            <article key={item.code}>
              <MenuImage src={item.imageUrl} alt={item.name} />
              <div>
                <strong>{item.name}</strong>
                <small>{item.category}</small>
                <p>
                  ₹{(item.price / 100).toFixed(2)} · {item.code}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
