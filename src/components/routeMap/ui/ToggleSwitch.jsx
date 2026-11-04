/* Pill switch used in the RouteMap sidebar. Styles: .rm-switch in routeMap.css */
export default function ToggleSwitch({ checked, onChange, label }) {
  return (
    <label className="rm-switch">
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        aria-checked={checked}
        aria-label={label}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="rm-switch-track" aria-hidden="true">
        <span className="rm-switch-thumb" />
      </span>
    </label>
  );
}
