import { Colord } from "colord";

type ColorInfo = {
  color: string;
  count: number;
  hsl: { h: number; s: number; l: number };
  closestMajorColor?: string;
};

const hslDistance = (hsl1: { h: number; s: number; l: number }, hsl2: { h: number; s: number; l: number }): number => {
  // Simple Euclidean distance in HSL space
  const dh = Math.min(Math.abs(hsl1.h - hsl2.h), 360 - Math.abs(hsl1.h - hsl2.h));
  const ds = Math.abs(hsl1.s - hsl2.s);
  const dl = Math.abs(hsl1.l - hsl2.l);
  return Math.sqrt(dh * dh + ds * ds + dl * dl);
};

const calculateInfluence = (colorA: ColorInfo, colorB: ColorInfo): number => {
  // Simplified influence calculation; adjust as needed
  const distance = hslDistance(colorA.hsl, colorB.hsl);
  if (distance === 0) return 0; // Avoid division by zero
  return colorB.count / distance; // Influence decreases with distance and increases with count
};

export const analyzeColorGravitation = (colorCount: Record<string, number>): ColorInfo[] => {
  let colors: ColorInfo[] = Object.keys(colorCount).map((color) => ({
    color,
    count: colorCount[color],
    hsl: new Colord(color).toHsl(),
  }));

  colors.forEach((color) => {
    let maxInfluence = 0;
    let majorColor: ColorInfo = null as any;

    colors.forEach((otherColor) => {
      if (color === otherColor) return; // Skip self
      const influence = calculateInfluence(color, otherColor);
      if (influence > maxInfluence) {
        maxInfluence = influence;
        majorColor = otherColor;
      }
    });

    if (majorColor) {
      color.closestMajorColor = `${majorColor.color} influence ${maxInfluence.toFixed(2)}`;
    }
  });

  return colors;
};
