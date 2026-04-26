import React from 'react'; // eslint-disable-line
import './MarqueeMessages.css';

const ALIGNMENT_MAP = {
  'Right to Left': { cls: 'marquee-rtl', vertical: false },
  'Left to Right': { cls: 'marquee-ltr', vertical: false },
  'Top to Bottom': { cls: 'marquee-ttb', vertical: true },
  'Bottom to Top': { cls: 'marquee-btu', vertical: true },
};

const MarqueeMessages = ({ messages = [], style = {}, className = '' }) => {
  const active = messages.filter((m) => m.Status === 'Activated');

  if (!active.length) return null;

  const alignment = active[0]?.Alignment || 'Right to Left';
  const color = active[0]?.Color || '#ffffff';
  const movement = active[0]?.Movement || 'Scroll';
  
  const { cls, vertical } = ALIGNMENT_MAP[alignment] || ALIGNMENT_MAP['Right to Left'];
  const text = active.map((m) => m.Message).join('     •     ');

  const isBlink = movement === 'Blink';
  const animationClass = isBlink ? 'marquee-blink' : cls;

  return (
    <div
      className={`marquee-banner ${vertical && !isBlink ? 'marquee-vertical' : 'marquee-horizontal'} ${className}`}
      style={{ ...style, color: color }}
    >
      <span className={`marquee-track ${animationClass}`}>{text}</span>
    </div>
  );
};

export default MarqueeMessages;
