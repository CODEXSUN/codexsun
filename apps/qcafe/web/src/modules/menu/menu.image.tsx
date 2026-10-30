import { useEffect, useState } from "react";
import { ImagePlus } from "lucide-react";
import { cloudResponse } from "../../web/transport";

export function MenuImage({ src, alt = "" }: { src?: string | undefined; alt?: string }) {
  const [loaded, setLoaded] = useState({ source: "", url: "" });
  const [failed, setFailed] = useState("");
  const managed = src?.startsWith("/api/app/qcafe/menu/");
  useEffect(() => {
    if (!src || !managed) return;
    let active = true;
    let objectUrl = "";
    void cloudResponse(src)
      .then((response) => response.blob())
      .then((blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setLoaded({ source: src, url: objectUrl });
      })
      .catch(() => {
        if (active) setFailed(src);
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src, managed]);
  const url = managed ? (loaded.source === src ? loaded.url : "") : src;
  return url && failed !== src ? (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(src ?? "")}
    />
  ) : (
    <ImagePlus aria-hidden="true" size={24} />
  );
}
