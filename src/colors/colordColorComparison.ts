import { Colord, HslaColor, LabaColor, extend } from "colord";
import labPlugin from "colord/plugins/lab";
import namesPlugin from "colord/plugins/names";

extend([labPlugin, namesPlugin]);

interface ColorInfo {
  variable: string;
  hsl: HslaColor;
  lab: LabaColor;
  hex: string;
  name: string;
  baseColor?: string;
  difference?: number;
  raw: Colord;
}

const parseColors = (colors: string[]): ColorInfo[] => {
    return colors
      .filter((color) => !color.includes('var'))
      .map((color) => ({color, raw: new Colord(color)}))
      .map(({color, raw}) => ({
        variable: color,
        hsl: raw.toHsl(),
        lab: raw.toLab(),
        hex: raw.toHex(),
        name: raw.toName({ closest: true }) || 'unknown',
        raw
    }))
}

export const treeShakeColors = (colors: string[], colorPallet: string[], deltaThreshold: number = Infinity) => {
    const parsedColors = parseColors(colors);
    const parsedBaseColors = parseColors(colorPallet);

    return parsedColors.map((color) => {
      let minDifference = deltaThreshold;
      let closestBaseColor: ColorInfo | undefined;

      parsedBaseColors.forEach((baseColor) => {
        const diff = baseColor.raw.delta(color.raw);
        if (diff < minDifference) {
          minDifference = diff;
          closestBaseColor = baseColor;
        }
      });

      return {...color, baseColor: closestBaseColor?.variable, difference: minDifference}
    })
}
