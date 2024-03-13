import { Colord, HslColor } from "colord";

export const sortColors = (colorCount: Record<string, number>) => {
  const colors = Object.keys(colorCount)
    .filter((color) => !color.includes("var"))
    .map((color) => ({
      color,
      count: colorCount[color],
      hsl: new Colord(color).toHsl(),
    }))
    .sort((a, b) => {
      if (a.hsl.h !== b.hsl.h) return a.hsl.h - b.hsl.h;
      if (a.hsl.s !== b.hsl.s) return a.hsl.s - b.hsl.s;
      return a.hsl.l - b.hsl.l;
    });

  return colors;
};


const calculateColorDifference = (colorA: HslColor, colorB: HslColor) => {
  // Simple color difference calculation based on HSL
  const hueDiff = Math.abs(colorA.h - colorB.h);
  const satDiff = Math.abs(colorA.s - colorB.s) * 100;
  const lightDiff = Math.abs(colorA.l - colorB.l) * 100;
  return (hueDiff + satDiff + lightDiff) / 3;
};

const calculateInfluence = (colorA: {count: number}, colorB: {count: number}) => {
  // Placeholder function to calculate the "gravitational pull"
  // You might want to refine how influence is calculated based on usage count
  const usageDifference = Math.abs(colorA.count - colorB.count);
  return usageDifference; // Simple version, adjust based on your needs
};

export const adjustColorsByUsage = (colorCount: Record<string, number>) => {
  let colors = Object.keys(colorCount)
    .filter(color => !color.includes("var"))
    .map(color => ({
      color,
      count: colorCount[color],
      hsl: new Colord(color).toHsl(),
      closestMajorColor: ""
    }))
    .sort((a, b) => a.hsl.h - b.hsl.h); // Sort by hue

  colors.forEach((color, index) => {
    let closestMajorColor = null;
    let minDifference = Infinity;
    let influence = 0;

    // Look both directions for a more used color within a reasonable hue range
    for (let i = 0; i < colors.length; i++) {
      if (i !== index && colors[i].count > color.count) {
        const difference = calculateColorDifference(color.hsl, colors[i].hsl);
        const currentInfluence = calculateInfluence(colors[i], color);
        if (currentInfluence > influence && difference < minDifference) {
          influence = currentInfluence;
          minDifference = difference;
          closestMajorColor = colors[i];
        }
      }
    }

    if (closestMajorColor) {
      color.closestMajorColor = `${closestMajorColor.color} difference ${minDifference.toFixed(2)}% influence ${influence}`;
    } else {
      color.closestMajorColor = "N/A"; // No dominant color in range
    }
  });

  return colors;
};

