import { execFile } from "node:child_process";
import { promisify } from "node:util";
const run = promisify(execFile);
export type KitchenPrinter = { name: string; isDefault: boolean; interactive: boolean };
async function powershell(script: string) {
  const result = await run(
    "powershell.exe",
    [
      "-NoProfile",
      "-NonInteractive",
      "-EncodedCommand",
      Buffer.from(script, "utf16le").toString("base64")
    ],
    { windowsHide: true, timeout: 30000, maxBuffer: 1024 * 1024 }
  );
  return result.stdout.trim();
}
export async function listKitchenPrinters(): Promise<KitchenPrinter[]> {
  if (process.platform !== "win32") return [];
  const text = await powershell(
    "@(Get-CimInstance Win32_Printer | Select-Object Name,Default,PortName) | ConvertTo-Json -Compress"
  );
  if (!text) return [];
  const data = JSON.parse(text);
  const rows: Array<{ Name: string; Default: boolean; PortName: string }> = Array.isArray(data)
    ? data
    : [data];
  return rows.map((row) => ({
    name: row.Name,
    isDefault: row.Default,
    interactive: row.PortName === "PORTPROMPT:" || /OneNote|PDF|XPS/i.test(row.Name)
  }));
}
export async function spoolKitchenToken(target: string, text: string) {
  const printers = await listKitchenPrinters();
  const printer =
    target === "system-default"
      ? printers.find((row) => row.isDefault)
      : printers.find((row) => row.name === target);
  if (!printer || printer.interactive)
    throw new Error(
      "Choose a physical KOT printer in Settings. File printers cannot print kitchen tokens automatically."
    );
  const payload = Buffer.from(JSON.stringify({ printer: printer.name, text }), "utf8").toString(
    "base64"
  );
  await powershell(`$ErrorActionPreference='Stop'
 Add-Type -AssemblyName System.Drawing
 $payload=ConvertFrom-Json ([Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${payload}')))
 $doc=New-Object Drawing.Printing.PrintDocument
 $doc.PrinterSettings.PrinterName=$payload.printer
 $doc.DocumentName='QCafe Kitchen Token'
 $doc.PrintController=New-Object Drawing.Printing.StandardPrintController
 $font=New-Object Drawing.Font('Arial',10)
 $script:remaining=[string]$payload.text
 $doc.add_PrintPage({param($sender,$event)
   $bounds=[Drawing.RectangleF]::new(5,5,$event.PageBounds.Width-10,$event.PageBounds.Height-10)
   [int]$characters=0; [int]$rows=0
   $null=$event.Graphics.MeasureString($script:remaining,$font,[Drawing.SizeF]::new($bounds.Width,$bounds.Height),[Drawing.StringFormat]::GenericDefault,[ref]$characters,[ref]$rows)
   if($characters -le 0){throw 'Kitchen token cannot fit the selected paper size.'}
   $event.Graphics.DrawString($script:remaining.Substring(0,$characters),$font,[Drawing.Brushes]::Black,$bounds)
   $script:remaining=$script:remaining.Substring($characters)
   $event.HasMorePages=$script:remaining.Length -gt 0
 })
 try{$doc.Print()} finally{$font.Dispose();$doc.Dispose()}`);
  return printer.name;
}
