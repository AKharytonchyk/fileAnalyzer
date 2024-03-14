import { exec } from 'child_process';
import { Colord, HslColor, extend } from "colord";
import path from 'path';
import namesPlugin from "colord/plugins/names";

extend([namesPlugin]);

// Define a type for the color information
interface ColorInfo {
    color: string;
    count: number;
    hsl: HslColor;
    name: string;
}

// Define a type for the result format
interface ColorDifferenceResult {
    color: string;
    count: number;
    basisColor: boolean;
    closestBasisColor: string;
    colorDifference: number;
    name: string;
}

// Utility function to sort and select basis colors
const selectBasisColors = (colorCount: Record<string, number>): ColorInfo[] => {
    const colors: ColorInfo[] = Object.keys(colorCount).map((color) => ({
        color,
        count: colorCount[color],
        hsl: new Colord(color).toHsl(),
        name: new Colord(color).toName({ closest: true }) || 'unknown',
    })).sort((a, b) => b.count - a.count); // Sort by count, descending

    return colors.slice(0, 20); // Select top 20 colors as basis
};

// Function to call the Python script for color difference calculation
const calculateColorDifferencePython = (color1: string, color2: string): Promise<number> => {
    return new Promise((resolve, reject) => {
        const process = exec(`${path.join(__dirname, 'calculate_ciede2000.py')} "${color1}" "${color2}"`, (error, stdout) => {
            if (error) {
                reject(error.message);
                return;
            }
            resolve(parseFloat(stdout));
        });
    });
};

// Main function to calculate differences for all colors against the basis colors
export const calculateDifferencesForAllColors = async (colorCount: Record<string, number>): Promise<ColorDifferenceResult[]> => {
    const basisColors = selectBasisColors(colorCount);
    const allColors = Object.keys(colorCount).map(color => ({
        color,
        count: colorCount[color],
        hsl: new Colord(color).toHsl(),
        name: new Colord(color).toName() || 'unknown'
    }));

    const results: ColorDifferenceResult[] = await Promise.all(allColors.map(async (colorInfo): Promise<ColorDifferenceResult> => {
        let closestBasisColor = basisColors[0]; // Default to the first basis color
        let closestDifference = Number.MAX_VALUE;

        for (const basisColor of basisColors) {
            const difference = await calculateColorDifferencePython(colorInfo.color, basisColor.color);
            if (difference < closestDifference) {
                closestDifference = difference;
                closestBasisColor = basisColor;
            }
        }

        return {
            color: colorInfo.color,
            count: colorInfo.count,
            name: colorInfo.name || 'unknown',
            basisColor: basisColors.some(basis => basis.color === colorInfo.color),
            closestBasisColor: closestBasisColor.color,
            colorDifference: closestDifference
        };
    }));

    return results;
};
