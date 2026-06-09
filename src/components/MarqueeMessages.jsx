import React from 'react'; // eslint-disable-line
import './MarqueeMessages.css';

const ALIGNMENT_MAP = {
  'Right to Left': { cls: 'marquee-rtl', vertical: false },
  'Left to Right': { cls: 'marquee-ltr', vertical: false },
  'Top to Bottom': { cls: 'marquee-ttb', vertical: true },
  'Bottom to Top': { cls: 'marquee-btu', vertical: true },
};

// Returns light or dark background so the user's text color is always readable
function getContrastBg(hex) {
  try {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.45 ? '#1e293b' : '#f1f5f9';
  } catch {
    return '#1e293b';
  }
}

const MarqueeMessages = ({ messages = [], style = {}, className = '' }) => {
  const active = messages.filter((m) => m.Status === 'Activated');

  if (!active.length) return null;

  const alignment = active[0]?.Alignment || 'Right to Left';
  const color = active[0]?.color || active[0]?.Color || '#ffffff';
  const movement = active[0]?.movement || active[0]?.Movement || 'Scroll';
  const bg = getContrastBg(color);

  const { cls, vertical } = ALIGNMENT_MAP[alignment] || ALIGNMENT_MAP['Right to Left'];
  const text = active.map((m) => m.Message).join('     •     ');

  const isBlink = movement === 'Blink';
  const animationClass = isBlink ? 'marquee-blink' : cls;

  return (
    <div
      className={`marquee-banner ${vertical && !isBlink ? 'marquee-vertical' : 'marquee-horizontal'} ${className}`}
      style={{ ...style, color, backgroundColor: bg }}
    >
      <span className={`marquee-track ${animationClass}`}>{text}</span>
    </div>
  );
};

export default MarqueeMessages;
