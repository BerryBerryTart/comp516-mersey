const X_ORIGIN = -20037508.342787;
const Y_ORIGIN = 20037508.342787;
const ZOOM_LEVEL = 20037508.342787;
const RIVER_THRESHOLD = 3;

export const getResLevel = (zoom) => {
  switch (zoom) {
    case 9:
      return 305.74811314055756;
    case 10:
      return 152.87405657041106;
    case 11:
      return 76.43702828507324;
    case 12:
      return 38.21851414253662;
    case 13:
      return 19.10925707126831;
    default:
      return undefined;
  }
};

export const metresPerPixel = (zoom, lat) => {
  return (
    (Math.cos((lat * Math.PI) / 180) * 2 * Math.PI * 6378137) /
    (256 * Math.pow(2, zoom))
  );
};

export const tileToEPSG3857 = (tile, isX, zoom) => {
  //x = xorigin + (tx * 256 * res)
  if (isX) {
    return X_ORIGIN + tile * 256 * getResLevel(zoom);
  }
  //y = yorigin - (ty * 256 * res)
  else {
    return Y_ORIGIN - tile * 256 * getResLevel(zoom);
  }
};

export const EPSG3857ToEPSG4326 = (pos) => {
  let x = pos[0];
  let y = pos[1];
  x = (x * 180) / ZOOM_LEVEL;
  y = (y * 180) / ZOOM_LEVEL;
  y = (Math.atan(Math.pow(Math.E, y * (Math.PI / 180))) * 360) / Math.PI - 90;
  return [x, y];
};

export const EPSG4326ToEPSG3857 = (pos) => {
  let x = pos[0];
  let y = pos[1];
  x = (x * ZOOM_LEVEL) / 180;
  y = Math.log(Math.tan(((90 + y) * Math.PI) / 360)) / (Math.PI / 180);
  y = (y * ZOOM_LEVEL) / 180;
  return [x, y];
};

/**
 *
 * @param {number} val: Elevation height in metres
 * @param {number} min: minimum elevation in set
 * @param {number} max: maximum elevation in set
 * @returns {string}: RGB hex code relating to elevation
 *
 * STEPS:
 * min - <=3 metres
 * >3 metres - <=25 metres
 * >25 metres - <=50 metres
 * >50 metres - max
 */
export function val2colour(val, min, max, threshold = RIVER_THRESHOLD) {
  if (val < min || val > max) {
    throw new Error("ERROR: VAL IS OUT OF BOUNDS!!!!!!");
  }
  let r = 0;
  let g = 0;
  let b = 0;

  //between RGB(200,200,200) && RGB(100,100,100)
  if (val <= threshold) {
    const offset = 100 + percInRange(val, min, threshold) * 100;
    r = offset;
    g = offset;
    b = offset;
  }
  //3 - 25 metres
  // between RGB(255,0,0) && RGB(255,255,0)
  else if (val > threshold && val <= 25) {
    r = 255;
    g = 0 + percInRange(val, threshold, 25) * 255;
  }
  // 25 - 50 metres
  // between RGB(255,255,0) && RGB(0,255,0)
  else if (val > 25 && val <= 50) {
    r = 255 - 255 * percInRange(val, 25, 50);
    g = 255;
  }
  // 50 metres - max (~71)
  // between RGB(0,255,0) && RGB(206,255,206)
  else {
    r = 0 + 206 * percInRange(val, 50, max);
    g = 255;
    b = 0 + 206 * percInRange(val, 50, max);
  }
  const rStr = Math.floor(r).toString(16).padStart(2, "0");
  const gStr = Math.floor(g).toString(16).padStart(2, "0");
  const bStr = Math.floor(b).toString(16).padStart(2, "0");
  return `#${rStr}${gStr}${bStr}`;
}

export function hexToVals(hexStr) {
  const hex = hexStr.replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return [r, g, b];
}

export function percInRange(val, min, max) {
  const range = Math.abs(max - min);
  const offsetVal = Math.abs(val - min);
  return offsetVal / range;
}
