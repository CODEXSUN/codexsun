// @ts-nocheck
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const DisabledSwitchDemo = () => {
  return (
    <div className="flex items-center gap-3">
      <Switch disabled id="enable-feature-disabled" />
      <Label htmlFor="enable-feature-disabled">Enable Feature</Label>
    </div>
  );
};

export default DisabledSwitchDemo;
