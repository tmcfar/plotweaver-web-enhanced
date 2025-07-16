export default function PanelFallback() {
  return (
    <div className="flex items-center justify-center h-full p-4">
      <p className="text-muted-foreground">Failed to load panel. Please try again.</p>
    </div>
  );
}
