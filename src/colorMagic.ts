import { Colord } from "colord";


export const sortColors = (colorCount: Record<string, number>) => {

  const colors = Object.keys(colorCount)
    .map((color) => ({ color, count: colorCount[color], hsl: new Colord(color).toHsv()}))
    .sort((a, b) => a.hsl.h - b.hsl.h); 

  return colors;
};