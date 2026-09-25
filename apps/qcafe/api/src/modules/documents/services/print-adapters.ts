import type { QcafePrinterProfileRow } from "../persistence/documents.database.js";

export type PrintAdapterKind = "browser" | "direct" | "gateway" | "bluetooth" | "network";

export interface PrintDispatchRequest {
  readonly jobId: string;
  readonly profile: QcafePrinterProfileRow;
}

export type PrintDispatchOutcome =
  | { readonly decision: "dispatched"; readonly endpointRef: string | null }
  | { readonly decision: "unavailable"; readonly reason: string };

export interface PrintAdapter {
  readonly kind: PrintAdapterKind;
  checkAvailability(profile: QcafePrinterProfileRow): PrintDispatchOutcome;
}

class BrowserPrintAdapter implements PrintAdapter {
  readonly kind = "browser" as const;

  checkAvailability(profile: QcafePrinterProfileRow): PrintDispatchOutcome {
    if (!profile.active) return { decision: "unavailable", reason: "The browser printer is inactive." };
    return { decision: "dispatched", endpointRef: profile.config_ref };
  }
}

class DirectPrintAdapter implements PrintAdapter {
  readonly kind = "direct" as const;

  checkAvailability(profile: QcafePrinterProfileRow): PrintDispatchOutcome {
    if (!profile.active) return { decision: "unavailable", reason: "The direct printer is inactive." };
    return { decision: "dispatched", endpointRef: profile.config_ref };
  }
}

class GatewayPrintAdapter implements PrintAdapter {
  readonly kind = "gateway" as const;

  checkAvailability(profile: QcafePrinterProfileRow): PrintDispatchOutcome {
    if (!profile.active) return { decision: "unavailable", reason: "The gateway printer is inactive." };
    if (!profile.config_ref) return { decision: "unavailable", reason: "The gateway printer has no endpoint." };
    return { decision: "dispatched", endpointRef: profile.config_ref };
  }
}

class BluetoothPrintAdapter implements PrintAdapter {
  readonly kind = "bluetooth" as const;

  checkAvailability(profile: QcafePrinterProfileRow): PrintDispatchOutcome {
    if (!profile.active) return { decision: "unavailable", reason: "The Bluetooth printer is inactive." };
    if (!profile.config_ref) return { decision: "unavailable", reason: "The Bluetooth printer has no paired device." };
    return { decision: "dispatched", endpointRef: profile.config_ref };
  }
}

class NetworkPrintAdapter implements PrintAdapter {
  readonly kind = "network" as const;

  checkAvailability(profile: QcafePrinterProfileRow): PrintDispatchOutcome {
    if (!profile.active) return { decision: "unavailable", reason: "The network printer is inactive." };
    if (!profile.config_ref) return { decision: "unavailable", reason: "The network printer has no host." };
    return { decision: "dispatched", endpointRef: profile.config_ref };
  }
}

const adapters: Record<PrintAdapterKind, PrintAdapter> = {
  bluetooth: new BluetoothPrintAdapter(),
  browser: new BrowserPrintAdapter(),
  direct: new DirectPrintAdapter(),
  gateway: new GatewayPrintAdapter(),
  network: new NetworkPrintAdapter(),
};

export function resolvePrintAdapter(kind: string): PrintAdapter {
  const adapter = (adapters as Record<string, PrintAdapter | undefined>)[kind];
  if (!adapter) throw new Error(`Unsupported printer adapter: ${kind}.`);
  return adapter;
}

export function dispatchThroughAdapter(request: PrintDispatchRequest): PrintDispatchOutcome {
  return resolvePrintAdapter(request.profile.kind).checkAvailability(request.profile);
}
