import fs from "fs";
import { makeSticker } from "./stickerMaker.ts";

async function test() {
  try {
    console.log("Started...");

    const sticker = await makeSticker(
      "C:/Users/OnCre/Documents/ViberDownloads/0-02-03-3f010bc01c666cf558b2b13e10330346e36aaf331e6a6d561a9100fb534d768f_12b0169a7d5191ba.jpg",
      10,
    );

    fs.writeFileSync("./output.webp", sticker);
    console.log("Success!!!");
  } catch (error) {
    console.error("Test Failed with error:", error);
  }
}

test();
