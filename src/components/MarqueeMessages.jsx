import React from 'react';
import './MarqueeMessages.css';

const ALIGNMENT_MAP = {
  'Right to Left': { cls: 'marquee-rtl', vertical: false },
  'Left to Right': { cls: 'marquee-ltr', vertical: false },
  'Top to Bottom': { cls: 'marquee-ttb', vertical: true },
  'Bottom to Top': { cls: 'marquee-btu', vertical: true },
};

function getContrastBg(hex) {
  try {
    const h = (hex || '').replace('#', '');
    if (h.length < 6) return '#1e293b';
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

  return (
    <div className={className} style={style}>
      {active.map((m, i) => {
        const alignment = m.Alignment || 'Right to Left';
        const color = m.color || m.Color || '#ffffff';
        const movement = m.movement || m.Movement || 'Scroll';
        const bg = getContrastBg(color);
        const { cls, vertical } = ALIGNMENT_MAP[alignment] || ALIGNMENT_MAP['Right to Left'];
        const isBlink = movement === 'Blink';
        const animationClass = isBlink ? 'marquee-blink' : cls;

        return (
          <div
            key={m.id ?? m.MessageId ?? i}
            className={`marquee-banner ${vertical && !isBlink ? 'marquee-vertical' : 'marquee-horizontal'}`}
            style={{ color, backgroundColor: bg, marginBottom: i < active.length - 1 ? '4px' : 0 }}
          >
            <span className={`marquee-track ${animationClass}`}>{m.Message}</span>
          </div>
        );
      })}
    </div>
  );
};

export default MarqueeMessages;
