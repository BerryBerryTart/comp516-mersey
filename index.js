const Lerc = require("lerc");
const fsProm = require("fs/promises");
const fs = require("fs");
const path = require("path");

const utils = require("./utils");
/** 
Geomatics Guidance Note Number 7, part 2
https://developers.auravant.com/en/blog/2022/09/09/post-3/
https://geologyviewer.bgs.ac.uk/
https://learn.microsoft.com/en-us/bingmaps/articles/bing-maps-tile-system?redirectedfrom=MSDN
https://services.arcgisonline.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer/tile/10/331/503

https://www.landis.org.uk/arcgis/rest/services/Soilscapes/natmapsoilscapes/MapServer/tile/ZOOM_LEVEL/Y/X
https://www.landis.org.uk/arcgis/rest/services/Soilscapes/natmapsoilscapes/MapServer/tile/9/166/251

https://epsg.io/transform#s_srs=3857&t_srs=4326&x=NaN&y=NaN
https://docs.maptiler.com/google-maps-coordinates-tile-bounds-projection/#3/50.00/15.00
https://services.arcgisonline.com/arcgis/rest/services/World_Street_Map/MapServer/tile/10/331/503
x = xorigin + (tx * 256 * res)
y = yorigin - (ty * 256 * res)
X: -20037508.342787
Y: 20037508.342787
*/

//riverhead offset in metres
const RIVERBED_OFFSET = 3;
const DATA_OUTPUT_PATH = "R:";
const TILES = [
  "4027,2654",
  "4027,2655",
  "4028,2654",
  "4028,2655",
  "4029,2654",
  "4029,2655",
];
let dataArr = ["longitude(x),latitude(y),elevation(z)\n"];
let dataArrColour = ["x,y,colour\n"];

const processTile = async (tileStr) => {
  await Lerc.load();

  const coords = tileStr.split(",");

  const x = Number(coords[0]);
  const y = Number(coords[1]);

  const dataArrBuff = [];

  const arrayBuffer = await fsProm.readFile(`./data/${x},${y}`);
  const pixelBlock = Lerc.decode(arrayBuffer);
  const { height, width, pixels, mask } = pixelBlock;

  for (let i = 0; i < height - 1; i++) {
    for (let j = 0; j < width - 1; j++) {
      const pixel = pixels[0][i * height + j];
      if (!mask || (mask[i * width + j] && pixel)) {
        const coords = [
          utils.tileToEPSG3857(x + j / 256, true, 13),
          utils.tileToEPSG3857(y + i / 256, false, 13),
        ];
        const latLong = utils.EPSG3857ToEPSG4326(coords);
        dataArrBuff.push(
          `${latLong[0].toFixed(6)},${latLong[1].toFixed(6)},${pixel.toFixed(
            8
          )}\n`
        );
      }
    }
  }

  return dataArrBuff;
};

/**
 * CUSTOM Image Array Dimensions:
 * WIDTH: (256 * 3) = 768
 * HEIGHT: (256 * 2) = 512
 */
const formatImageArray = () => {
  //GET MIN MAX
  const vals = [];

  for (let i = 1; i < dataArr.length; i++) {
    const line = Number(dataArr[i].split(",")[2].replace("\n", ""));
    vals.push(Number(line));
  }
  vals.sort((a, b) => a - b);
  const min = vals[0];
  const max = vals[vals.length - 1];

  for (let index = 1; index < dataArr.length; index++) {
    const height = Number(dataArr[index].split(",")[2].replace("\n", ""));
    const colour =
      height <= RIVERBED_OFFSET
        ? utils.perc2color(-1 * Math.abs(height / Math.abs(min - 3)))
        : utils.perc2color(height / (max - RIVERBED_OFFSET));
    dataArrColour.push(
      `${Math.floor((index - 1) % 768)},${Math.floor(
        (index - 1) / 768
      )},${colour}\n`
    );
  }
};

async function main() {
  for (let i = 0; i < TILES.length; i++) {
    const res = await processTile(TILES[i]);
    dataArr.push(...res);
  }
  dataArr.sort((a, b) => {
    const coordsA = a.split(",");
    const coordsB = b.split(",");
    return coordsB[0] === coordsA[0]
      ? coordsA[0] - coordsB[0]
      : coordsB[1] - coordsA[1];
  });

  formatImageArray();

  fs.writeFileSync(path.join(DATA_OUTPUT_PATH, "data.csv"), dataArr.join(""));
  fs.writeFileSync(
    path.join(DATA_OUTPUT_PATH, "dataColour.csv"),
    dataArrColour.join("")
  );
}

main();
