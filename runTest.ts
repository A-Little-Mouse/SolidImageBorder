import fs from "fs";
import { makeSticker } from "./stickerMaker.ts";

async function test() {
  try {
    console.log("Started...");

    const sticker = await makeSticker(
      //file path here for testing
      ""
      10,
    );

    fs.writeFileSync("./output.webp", sticker);
    console.log("Success!!!");
  } catch (error) {
    console.error("Test Failed with error:", error);
  }
}

test();
