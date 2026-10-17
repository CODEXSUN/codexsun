export function FeedFeedback({
  loading,
  error,
  retry,
  label
}: {
  loading: boolean;
  error: string;
  retry: () => void;
  label: string;
}) {
  if (loading)
    return (
      <div className="tc-feed-feedback" role="status">
        <span className="tc-loading-dot" />
        Loading {label}…
      </div>
    );
  if (error)
    return (
      <div className="tc-feed-feedback tc-feed-error" role="alert">
        <p>{label} couldn’t load. The rest of the portal is still available.</p>
        <button onClick={retry}>Try again</button>
      </div>
    );
  return null;
}
