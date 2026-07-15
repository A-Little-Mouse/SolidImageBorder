import sharp, { type Sharp } from "sharp";
// sharp allows to execute every effect you want on an image at once using Cpp , i think
export interface StickerOptions {
  size: number; // border size in pixel
  color?: { r: number; g: number; b: number }; // takes value in rgb
  format?: "webp" | "png"; // pick format , add as allowed
}

const DEFAULT_COLOR = { r: 255, g: 255, b: 255 };
const DEFAULT_FORMAT = "webp" as const;

// puts sharp pipeline in png or webp format
function applyOutputFormat(
  pipeline: Sharp,
  format: "webp" | "png",
): Sharp {
  if (format === "png") return pipeline.png();
  return pipeline.webp();
}

export async function makeSticker(
  input: string | Buffer,
  options: StickerOptions,
): Promise<Buffer> {
  const { size, color = DEFAULT_COLOR, format = DEFAULT_FORMAT } = options;

  // validate image border size , color and format
  if (!Number.isInteger(size) || size <= 0) {
    throw new Error(`"size" must be a positive integer, received: ${size}`);
  }
  if (
    [color.r, color.g, color.b].some(
      (c) => !Number.isFinite(c) || c < 0 || c > 255,
    )
  ) {
    throw new Error(
      `"color" r/g/b values must be between 0 and 255, received: {r: ${color.r}, g: ${color.g}, b: ${color.b}}`,
    );
  }

  // sharp instance for buffer
  const sharpInstance = sharp(input);
  const metadata = await sharpInstance.metadata();
  const { height, width } = metadata;

  if (!height || !width) {
    throw new Error("Input image has no detectable width or height");
  }

  // get image buffer
  const imgBuffer =
    typeof input === "string"
      ? await sharpInstance.clone().toBuffer()
      : input;

  // extract just the alpha channel as a grayscale PNG
  const alphaBuffer = await sharp(imgBuffer)
    .ensureAlpha()
    .extractChannel(3)
    .png()
    .toBuffer();
  const base64Alpha = alphaBuffer.toString("base64");

  // size of expanded canvas
  const paddedWidth = width + size * 2;
  const paddedHeight = height + size * 2;

  // normalize border color to 0–1 for the SVG feColorMatrix
  const nr = color.r / 255;
  const ng = color.g / 255;
  const nb = color.b / 255;

  // the SVG mask--done through AI gng , i have very little to no clue about the fuck i did here 
  //   1. feColorMatrix — the input is a grayscale alpha-channel image where
  //      R=G=B=original_alpha. The matrix maps R → new A (shape) and sets
  //      RGB to the desired border color.
  //   2. feGaussianBlur — smooths edges to avoid jaggedness
  //   3. feMorphology dilate — expands the shape outward by `size` pixels
  //   4. feComponentTransfer — sharpens the blurred edge back into a crisp line
  const svgMask = `
    <svg width="${paddedWidth}" height="${paddedHeight}" viewBox="0 0 ${paddedWidth} ${paddedHeight}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="smooth-border">
            <feColorMatrix type="matrix" values="0 0 0 0 ${nr}   0 0 0 0 ${ng}   0 0 0 0 ${nb}   1 0 0 0 0" result="colored"/>
            <feGaussianBlur stdDeviation="3" in="colored" result="smoothed"/>
            <feMorphology operator="dilate" radius="${size}" in="smoothed" result="dilated"/>
            <feComponentTransfer in="dilated" result="sharp">
                <feFuncA type="linear" slope="20" intercept="-10"/>
            </feComponentTransfer>
            <feMerge>
                <feMergeNode in="sharp"/>
            </feMerge>
        </filter>
      </defs>
      <image href="data:image/png;base64,${base64Alpha}" x="${size}" y="${size}" width="${width}" height="${height}" filter="url(#smooth-border)"/>
    </svg>
  `;

  // putting the SVG mask underneath the original image
  const stickerImage = await applyOutputFormat(
    sharp(imgBuffer)
      .extend({
        top: size,
        bottom: size,
        left: size,
        right: size,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .composite([{ input: Buffer.from(svgMask), blend: "dest-over" }]),
    format,
  ).toBuffer();

  return stickerImage;
}
