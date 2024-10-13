import { DataCollection } from "./dataCollection.js";

async function main() {
  const dc = new DataCollection();
  await dc.buildData();

  console.log(`TOTAL CELLS: ${dc.dataArr.length}`);
  for (let i = 0; i < 20; i++) {
    const val = 3 + i / 2;
    dc.formatImageArray(val, true, i.toString().padStart(4, "0"));
    dc.flushColourData();
    console.log(`CREATING IMAGE NO ${i.toString()}`)

  }
}

main();
