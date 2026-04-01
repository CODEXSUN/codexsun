import { Spinner } from "@ui/components/ui/spinner";
import { Button } from "@ui/registry/ui/button";

const LoadingButtonDemo = () => {
  return (
    <div className="flex items-center gap-2">
      <Button size="icon">
        <Spinner />
      </Button>
      <Button>
        <Spinner /> Loading
      </Button>
    </div>
  );
};

export default LoadingButtonDemo;
