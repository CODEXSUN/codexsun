import { invoke } from "@tauri-apps/api/core";

export interface DesktopRuntime {
  readonly platform: string;
  readonly version: string;
}

export async function readDesktopRuntime(): Promise<DesktopRuntime> {
  return invoke<DesktopRuntime>("desktop_runtime");
}
