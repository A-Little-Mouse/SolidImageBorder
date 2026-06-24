# SolidImageBorder
Node.js utility built with TypeScript and `sharp` that programmatically applies solid, crisp white vector outlines to shapes and transparent images. 

---

## Features

Avoids jagged, low-quality pixel dilation. Uses SVG morphological operations (`feMorphology` and alpha-channel transfer sharpening) for vector-smooth outlines.
Automatically expands the canvas boundaries by the exact margin size specified, ensuring borders are never clipped.
Accepts local file system paths (`string`) or raw memory representations (`Buffer`) directly from clipboards, network requests, or database streams.
Compresses and exports your processed sticker as a clean, highly optimized `.webp` file with transparency preserved.

---

## Installation

Clone this repository and install the project dependencies:

---
BALM
