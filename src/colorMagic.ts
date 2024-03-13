import { Colord } from "colord";

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
