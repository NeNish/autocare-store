// Re-mounts on every navigation, so each page settles in with a soft cinematic fade.
export default function Template({ children }) {
  return <div className="page-enter">{children}</div>;
}
