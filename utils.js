const X_ORIGIN = -20037508.342787;
const Y_ORIGIN = 20037508.342787;
const ZOOM_LEVEL = 20037508.342787;

const getResLevel = (zoom) => {
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

const metresPerPixel = (zoom, lat) => {
  return (
    (Math.cos((lat * Math.PI) / 180) * 2 * Math.PI * 6378137) /
    (256 * Math.pow(2, zoom))
  );
};

const tileToEPSG3857 = (tile, isX, zoom) => {
  //x = xorigin + (tx * 256 * res)
  if (isX) {
    return X_ORIGIN + tile * 256 * getResLevel(zoom);
  }
  //y = yorigin - (ty * 256 * res)
  else {
    return Y_ORIGIN - tile * 256 * getResLevel(zoom);
  }
};

const EPSG3857ToEPSG4326 = (pos) => {
  let x = pos[0];
  let y = pos[1];
  x = (x * 180) / ZOOM_LEVEL;
  y = (y * 180) / ZOOM_LEVEL;
  y = (Math.atan(Math.pow(Math.E, y * (Math.PI / 180))) * 360) / Math.PI - 90;
  return [x, y];
};

const EPSG4326ToEPSG3857 = (pos) => {
  let x = pos[0];
  let y = pos[1];
  x = (x * ZOOM_LEVEL) / 180;
  y = Math.log(Math.tan(((90 + y) * Math.PI) / 360)) / (Math.PI / 180);
  y = (y * ZOOM_LEVEL) / 180;
  return [x, y];
};

function perc2color(perc) {
  perc = perc * 100;
  let r = 0;
  let g = 0;
  let b = 0;
  if (perc < 0) {
    r = 0;
    g = 0;
    b = Math.round(510 - 5.1 * Math.abs(perc));
  } else if (perc >= 0 && perc < 50) {
    r = 255;
    g = Math.round(5.1 * perc);
  } else {
    g = 255;
    r = Math.round(510 - 5.1 * perc);
  }
  let h = r * 0x10000 + g * 0x100 + b * 0x1;
  return "#" + ("000000" + h.toString(16)).slice(-6);
}

module.exports = {
  tileToEPSG3857,
  EPSG4326ToEPSG3857,
  EPSG3857ToEPSG4326,
  perc2color,
  metresPerPixel,
};
