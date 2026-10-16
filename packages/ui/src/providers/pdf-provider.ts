import { jsPDF } from "jspdf";

export type PdfDocumentSource = {
  content: string;
  title: string;
};

export type PdfShareChannel = "email" | "whatsapp";

export class PdfProvider {
  static async copyText(content: string): Promise<void> {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(content);
        return;
      } catch {
        // Browser clipboard permissions can be unavailable in embedded desktop webviews.
      }
    }

    const textarea = window.document.createElement("textarea");
    textarea.value = content;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    window.document.body.append(textarea);
    textarea.select();
    window.document.execCommand("copy");
    textarea.remove();
  }

  static async shareText(source: PdfDocumentSource): Promise<void> {
    if (navigator.share) {
      try {
        await navigator.share({ text: source.content, title: source.title });
        return;
      } catch (error) {
        if ((error as { name?: string }).name === "AbortError") return;
      }
    }
    await this.copyText(source.content);
  }

  static async create(source: PdfDocumentSource): Promise<File> {
    const document = new jsPDF({ format: "a4", unit: "mm" });
    const margin = 18;
    const pageWidth = document.internal.pageSize.getWidth() - margin * 2;
    const pageHeight = document.internal.pageSize.getHeight() - margin * 2;
    const title = source.title.trim() || "Zetro response";
    const lines = document.splitTextToSize(toPlainText(source.content), pageWidth);
    let cursor = margin;

    document.setFont("helvetica", "bold");
    document.setFontSize(16);
    document.text(title, margin, cursor);
    cursor += 10;
    document.setFont("helvetica", "normal");
    document.setFontSize(10);

    for (const line of lines) {
      if (cursor > pageHeight) {
        document.addPage();
        cursor = margin;
      }
      document.text(line, margin, cursor);
      cursor += 5;
    }

    const pageCount = document.getNumberOfPages();
    for (let page = 1; page <= pageCount; page += 1) {
      document.setPage(page);
      document.setFontSize(8);
      document.setTextColor(110);
      document.text(`Zetro · ${page} / ${pageCount}`, margin, document.internal.pageSize.getHeight() - 10);
      document.setTextColor(0);
    }

    return new File([document.output("blob")], `${toFileName(title)}.pdf`, { type: "application/pdf" });
  }

  static async download(source: PdfDocumentSource): Promise<File> {
    const file = await this.create(source);
    const url = URL.createObjectURL(file);
    const anchor = window.document.createElement("a");
    anchor.href = url;
    anchor.download = file.name;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    return file;
  }

  static print(source: PdfDocumentSource): void {
    const printWindow = window.open("", "_blank", "popup");
    if (!printWindow) throw new Error("Allow pop-ups to print this response.");
    printWindow.document.write(printDocument(source));
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  static async share(source: PdfDocumentSource, channel: PdfShareChannel): Promise<void> {
    const file = await this.create(source);
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], text: source.title, title: source.title });
      return;
    }

    await this.download(source);
    const message = encodeURIComponent(`${source.title}\n\nThe PDF has downloaded and is ready to attach.`);
    if (channel === "email") {
      window.location.assign(`mailto:?subject=${encodeURIComponent(source.title)}&body=${message}`);
      return;
    }
    window.open(`https://wa.me/?text=${message}`, "_blank", "noopener,noreferrer");
  }
}

function toPlainText(value: string): string {
  const parser = new DOMParser();
  return (parser.parseFromString(value, "text/html").body.textContent || value)
    .replace(/```[\s\S]*?```/g, (block) => block.replace(/```/g, ""))
    .replace(/[`*_#]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function toFileName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "zetro-response";
}

function printDocument(source: PdfDocumentSource): string {
  const content = escapeHtml(source.content).replace(/\n/g, "<br />");
  return `<!doctype html><html><head><title>${escapeHtml(source.title)}</title><style>@page { margin: 18mm; } body { color: #111; font: 11pt/1.6 Arial, sans-serif; } h1 { font-size: 18pt; margin: 0 0 12mm; } article { white-space: normal; } </style></head><body><h1>${escapeHtml(source.title)}</h1><article>${content}</article></body></html>`;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
