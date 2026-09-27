type StatusCardProps = {
  children?: string;
};

export function StatusCard({ children }: StatusCardProps) {
  return <section className="rounded-lg border p-4">{children}</section>;
}
