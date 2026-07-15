import sharp from "sharp";

export async function makeSticker(
  input: string | Buffer,
  size: number,
): Promise<Buffer> {
  const metadata = await sharp(input).metadata();
  const height = metadata.height;
  const width = metadata.width;

  if (!height || !width) {
    throw new Error("No width or height");
  }

  //gets imagebuffer if image path is given
  const imgBuffer = typeof input === "string" ? await sharp(input).toBuffer() : input;
  //converts image to base64 string format
  const base64Img = imgBuffer.toString("base64");
  //determines the image format
  const mimeType = `image/${metadata.format}`;

  //size of expanded canvas
  const paddedWidth = width + size * 2;
  const paddedHeight = height + size * 2;

  // creates a white silhouette which is expanded by <size>
  // forces r, g, b color channels to pure white
  // blurs the edges slightly to make them smooth
  // dilates/expands the smooth shape by radius = <size>
  // sharpens the blurry outer edge back into a crisp line
  const svgMask = `
    <svg width="${paddedWidth}" height="${paddedHeight}" viewBox="0 0 ${paddedWidth} ${paddedHeight}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="smooth-border">
            <feColorMatrix type="matrix" values="0 0 0 0 1   0 0 0 0 1   0 0 0 0 1   0 0 0 1 0" result="white"/>
            <feGaussianBlur stdDeviation="3" in="white" result="smoothed"/>
            <feMorphology operator="dilate" radius="${size}" in="smoothed" result="dilated"/>
            <feComponentTransfer in="dilated" result="sharp">
                <feFuncA type="linear" slope="20" intercept="-10"/>
            </feComponentTransfer>

            <feMerge>
                <feMergeNode in="sharp"/>
            </feMerge>
        </filter>
            </defs>
            <image href="data:${mimeType};base64,${base64Img}" x="${size}" y="${size}" width="${width}" height="${height}" filter="url(#smooth-border)"/>
      </svg>
  `;

  //combines the svgMask underneath the image
  const stickerImage = await sharp(imgBuffer)
    .extend({
      top: size,
      bottom: size,
      left: size,
      right: size,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .composite([{ input: Buffer.from(svgMask), blend: "dest-over" }])
    .webp() //you can convert this to anytype as per your wish
    .toBuffer();

  return stickerImage;
}
