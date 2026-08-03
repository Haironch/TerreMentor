export function AppSkeleton() {
  return (
    <main className="app-grid">
      <div className="skeleton skeleton-map" />
      <aside className="app-sidebar">
        <div className="skeleton skeleton-card-lg" />
        <div className="skeleton skeleton-card-sm" />
        <div className="skeleton skeleton-card-sm" />
      </aside>
    </main>
  );
}
