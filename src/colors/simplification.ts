import { Colord, HslColor } from "colord";

type ColorInfo = {
  color: string;
  count: number;
  hsl: HslColor;
  mergedInto?: string; // Optional: Track the color it has been merged into
};

const hslDistance = (hsl1: HslColor, hsl2: HslColor): number => {
  const dh = Math.abs(hsl1.h - hsl2.h);
  const ds = Math.abs(hsl1.s - hsl2.s) * 100; // Scale to match hue's range
  const dl = Math.abs(hsl1.l - hsl2.l) * 100; // Scale to match hue's range
  return Math.sqrt(dh * dh + ds * ds + dl * dl);
};

const mergeColorsBasedOnUsage = (colors: ColorInfo[], similarityThreshold: number): ColorInfo[] => {
  // Sort colors by usage count in descending order
  colors.sort((a, b) => b.count - a.count);

  colors.forEach((color, index) => {
    if (color.mergedInto) return; // Skip already merged colors

    // Find the closest color with a higher usage count
    let closest = { index: -1, distance: Infinity };
    for (let i = 0; i < colors.length; i++) {
      if (i === index || colors[i].mergedInto) continue; // Skip self and already merged colors

      const distance = hslDistance(color.hsl, colors[i].hsl);
      if (distance < closest.distance && colors[i].count > color.count) {
        closest = { index: i, distance };
      }
    }

    // Merge color if similar and more used color is found within threshold
    if (closest.distance < similarityThreshold) {
      color.mergedInto = colors[closest.index].color; // Mark this color as merged into the more used one
      // Optionally, update the count of the color it's merged into (if desired)
      // colors[closest.index].count += color.count;
    }
  });

  // Filter out colors that have been merged into others
  return colors.filter(color => !color.mergedInto);
};

export const sortAndSimplifyColors = (colorCount: Record<string, number>, similarityThreshold: number = 10) => {
  let colors: ColorInfo[] = Object.keys(colorCount)
    .filter(color => !color.includes("var"))
    .map(color => ({
      color,
      count: colorCount[color],
      hsl: new Colord(color).toHsl(),
    }));

  // Merge colors based on usage and similarity
  return mergeColorsBasedOnUsage(colors, similarityThreshold);
};
