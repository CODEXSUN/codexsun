"use client";

import { useState } from "react";
import { Switch } from "@ui/registry/ui/switch";

const ControlledSwitchDemo = () => {
  const [checked, setChecked] = useState<boolean>();

  return <Switch checked={checked} onCheckedChange={setChecked} />;
};

export default ControlledSwitchDemo;
