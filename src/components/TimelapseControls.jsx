export function TimelapseControls({ disabled, isPlaying, progress, label, onTogglePlay, onScrub }) {
  return (
    <div className="timelapse-controls">
      <button
        type="button"
        className="timelapse-play"
        onClick={onTogglePlay}
        disabled={disabled}
        title={isPlaying ? "Pausar" : "Reproducir la semana"}
      >
        {isPlaying ? "⏸" : "▶"}
      </button>

      <input
        type="range"
        className="timelapse-scrubber"
        min={0}
        max={1000}
        value={Math.round(progress * 1000)}
        disabled={disabled}
        onChange={(e) => onScrub(Number(e.target.value) / 1000)}
      />

      <span className="timelapse-label">{label}</span>
    </div>
  );
}
