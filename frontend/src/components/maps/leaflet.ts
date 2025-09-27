import L from "leaflet";

import icon2x from "leaflet/dist/images/marker-icon-2x.png";
import icon from "leaflet/dist/images/marker-icon.png";
import shadow from "leaflet/dist/images/marker-shadow.png";

let fixed = false;

export function ensureLeafletIcons() {
  if (fixed) return;
  const iconDefault = L.icon({
    iconUrl: icon,
    iconRetinaUrl: icon2x,
    shadowUrl: shadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
  L.Marker.prototype.options.icon = iconDefault;
  fixed = true;
}
