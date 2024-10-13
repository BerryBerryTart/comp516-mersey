import * as Lerc from "lerc";
import { readFile } from "fs/promises";
import { writeFileSync, createWriteStream } from "fs";
import { join } from "path";
import { PNG } from "pngjs/browser.js";

import {
  tileToEPSG3857,
  EPSG3857ToEPSG4326,
  val2colour,
  hexToVals,
} from "./utils.js";
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

export class DataCollection {
  constructor() {
    this.DATA_OUTPUT_PATH = "R:";
    this.TILES = [
      "4027,2654",
      "4027,2655",
      "4028,2654",
      "4028,2655",
      "4029,2654",
      "4029,2655",
    ];
    this.dataArr = ["longitude(x),latitude(y),elevation(z)\n"];
    this.dataArrColour = ["x,y,z,colour\n"];
  }

  async processTiles(tileStr) {
    await Lerc.load();

    const coords = tileStr.split(",");

    const x = Number(coords[0]);
    const y = Number(coords[1]);

    const dataArrBuff = [];

    const arrayBuffer = await readFile(`./data/${x},${y}`);
    const pixelBlock = Lerc.decode(arrayBuffer);
    const { height, width, pixels, mask } = pixelBlock;

    for (let i = 0; i < height - 1; i++) {
      for (let j = 0; j < width - 1; j++) {
        const pixel = pixels[0][i * height + j];
        if (!mask || (mask[i * width + j] && pixel)) {
          const coords = [
            tileToEPSG3857(x + j / 256, true, 13),
            tileToEPSG3857(y + i / 256, false, 13),
          ];
          const latLong = EPSG3857ToEPSG4326(coords);
          dataArrBuff.push(
            `${latLong[0].toFixed(6)},${latLong[1].toFixed(6)},${pixel.toFixed(
              8
            )}\n`
          );
        }
      }
    }

    return dataArrBuff;
  }

  /**
   * CUSTOM Image Array Dimensions:
   * WIDTH: (256 * 3) = 768
   * HEIGHT: (256 * 2) = 512
   */
  formatImageArray(riverLevel = undefined, save = false, fileName = undefined) {
    //GET MIN MAX
    const vals = [];

    for (let i = 1; i < this.dataArr.length; i++) {
      const line = Number(this.dataArr[i].split(",")[2].replace("\n", ""));
      vals.push(Number(line));
    }
    vals.sort((a, b) => a - b);
    const min = vals[0];
    const max = vals[vals.length - 1];

    for (let index = 1; index < this.dataArr.length; index++) {
      const height = Number(
        this.dataArr[index].split(",")[2].replace("\n", "")
      );
      const colour = riverLevel
        ? val2colour(height, min, max, riverLevel)
        : val2colour(height, min, max);
      this.dataArrColour.push(
        `${Math.floor((index - 1) % 768)},${Math.floor(
          (index - 1) / 768
        )},${height.toFixed(4)},${colour}\n`
      );
    }
    if (save && fileName) {
      this.generateImageAndSave(fileName);
    }
  }

  flushColourData() {
    this.dataArrColour = ["x,y,z,colour\n"];
  }

  async buildData() {
    console.log("Gathering Data");
    for (let i = 0; i < this.TILES.length; i++) {
      const res = await this.processTiles(this.TILES[i]);
      this.dataArr.push(...res);
    }
    this.dataArr.sort((a, b) => {
      const coordsA = a.split(",");
      const coordsB = b.split(",");
      return coordsB[0] === coordsA[0]
        ? coordsA[0] - coordsB[0]
        : coordsB[1] - coordsA[1];
    });
  }

  generateImageAndSave(fileName) {
    const png = new PNG({
      width: 768,
      height: 512,
      filterType: 0 
    });
    for (let i = 1; i < this.dataArrColour.length; i++) {
      const x = Math.floor((i - 1) % 768);
      const y = Math.floor((i - 1) / 768);
      const colours = this.dataArrColour[i].split(",")[3].replace("\n", "");
      const colourVals = hexToVals(colours);
      const idx = (png.width * y + x) << 2;
      png.data[idx] = colourVals[0]; // red
      png.data[idx + 1] = colourVals[1]; // green
      png.data[idx + 2] = colourVals[2]; // blue
      png.data[idx + 3] = 255;
    }
    const buffer = PNG.sync.write(png);
    writeFileSync(join(this.DATA_OUTPUT_PATH, "data", `${fileName}.png`), buffer);
  }

  saveData() {
    writeFileSync(
      join(this.DATA_OUTPUT_PATH, "data.csv"),
      this.dataArr.join("")
    );
  }

  saveColourData() {
    writeFileSync(
      join(this.DATA_OUTPUT_PATH, "dataColour.csv"),
      this.dataArrColour.join("")
    );
  }
}
