import L from "leaflet";

export const hexToRgb = (hex) => {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(
        result[3],
        16
      )}`
    : null;
};

export const groupMarkersByLocation = (stops, latKey, lngKey) => {
  const coordMap = {};
  stops.forEach((stop) => {
    const lat = parseFloat(stop[latKey]);
    const lng = parseFloat(stop[lngKey]);
    if (isNaN(lat) || isNaN(lng)) return;
    const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
    if (!coordMap[key]) coordMap[key] = { lat, lng, stops: [] };
    coordMap[key].stops.push(stop);
  });
  return Object.values(coordMap);
};

// Icons are cached: react-leaflet calls setIcon whenever the icon prop changes
// identity, which replaces the marker element and aborts an in-progress drag.
const iconCache = new Map();
const cachedIcon = (key, build) => {
  if (!iconCache.has(key)) iconCache.set(key, build());
  return iconCache.get(key);
};

export function createMultiStopMarker(color, count) {
  return cachedIcon(`multi|${color}|${count}`, () => buildMultiStopMarker(color, count));
}

function buildMultiStopMarker(color, count) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44">
      <circle cx="25" cy="25" r="15" fill="${color}" opacity="0.3" stroke="white" stroke-width="1.5"/>
      <circle cx="22" cy="22" r="16" fill="white" stroke="#333" stroke-width="2"/>
      <circle cx="22" cy="22" r="14" fill="${color}"/>
      <text x="22" y="27" text-anchor="middle"
            font-family="Arial Black, sans-serif"
            font-size="13"
            font-weight="900"
            fill="white"
            stroke="rgba(0,0,0,0.8)"
            stroke-width="2"
            paint-order="stroke fill">${count}</text>
    </svg>
  `;
  return new L.Icon({
    iconUrl: "data:image/svg+xml;base64," + btoa(svg),
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22],
  });
}

export function createColoredMarker(color, stopNo, gender) {
  return cachedIcon(`stop|${color}|${stopNo}|${gender}`, () => buildColoredMarker(color, stopNo, gender));
}

function buildColoredMarker(color, stopNo, gender) {
  const genderInitial = gender ? gender.charAt(0).toUpperCase() : '';
  const markerText = `${stopNo}${genderInitial}`;
  
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
      <circle cx="18" cy="18" r="16" fill="white" stroke="#333" stroke-width="2"/>
      <circle cx="18" cy="18" r="14" fill="${color}"/>
      <text x="18" y="23" text-anchor="middle" 
            font-family="Arial Black, sans-serif" 
            font-size="12" 
            font-weight="900" 
            fill="white" 
            stroke="rgba(0,0,0,0.8)" 
            stroke-width="2" 
            paint-order="stroke fill">${markerText}</text>
    </svg>
  `;
  return new L.Icon({
    iconUrl: "data:image/svg+xml;base64," + btoa(svg),
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
}

export const ROUTE_COLORS = [
  "#4285F4",
  "#EA4335",
  "#FBBC05",
  "#34A853",
  "#A142F4",
  "#F44292",
  "#00B8D9",
  "#FF6D01",
  "#46BDC6",
  "#FFB300",
  "#8E24AA",
  "#43A047",
  "#F4511E",
  "#3949AB",
  "#757575",
  "#C0CA33",
  "#D81B60",
  "#00897B",
  "#6D4C41",
  "#7E57C2",
];

export const facilityIcon = new L.Icon({
  iconUrl: "images/icons/facility.png",
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});
