import fs from 'fs';
import path from 'path';
import { Colord, extend } from "colord";
import namesPlugin from "colord/plugins/names";
import {currentColorVariables} from './currentColorVariables';
import applicationColors from './files/application_colors.json'
import { treeShakeColors } from './colors/colordColorComparison';
extend([namesPlugin]);

const litmosFigmaColorMapping = {
    "0059C8": "--litmos-ui-primary-color",
    "761EF3": "--litmos-ui-secondary-color",
    "FFFFFF": "--litmos-ui-white-color",
    "444790": "--litmos-ui-accent-color",
    "EAF4FF": "--litmos-ui-highlight-color",
    "FFC300": "--litmos-ui-brand-gold-color",
    '32363A': '--litmos-typography-body-color',
    '4D4D4D': '--litmos-typography-header-color',
    '9B3800': '--litmos-typography-error-text-color',
    'F8D7DA': '--litmos-typography-error-text-bg-color',
    '4D6A65': '--litmos-typography-success-text-color',
    'FBFBFB': '--litmos-typography-white-text-color',
    'C1C7CE': '--litmos-layout-edge-color',
    'CDCDCD': '--litmos-layout-tile-outline-color',
    'EEEEEE': '--litmos-layout-light-devider-line-color',
    '1B1B1B': '--litmos-layout-dark-page-bg-color',
    '2C2C2C': '--litmos-layout-dark-panel-bg-color',
    '009AF9': '--litmos-electric-azure-color',
    'E6037C': '--litmos-rose-color',
    'ACA8CD': '--litmos-soft-lavender-color',
    'A8B1E8': '--litmos-soft-blue-color',
} as Record<string, string>;

const cssFile = fs.readFileSync(path.join(__dirname, 'files/colormatch.css'), 'utf-8');

const lines = cssFile.split('\n');
const regExp = /:\s?(.*);[ ,\/,\d,*]+[*, ]([A-F,0-9]{5,6})/i;

const colorsMapping = lines.reduce((acc, line, index) => {
    const [,currentColor, updatedColor] = line.match(regExp) || [];
    if(!currentColor || !updatedColor) {
        console.log(line);
        console.table( line.match(regExp));
        return acc;
    }
    const variableName = litmosFigmaColorMapping[updatedColor.toUpperCase()] ?? ('--litmos-new-'+(new Colord('#'+updatedColor).toName({ closest: true }) || 'unknown')+'-color') ;
    acc[currentColor] = {updatedColor: updatedColor.toUpperCase(), variableName: `${variableName}`};
    
    return acc;
}, {} as Record<string, {updatedColor: string, variableName: string}>)

const variableMapping = Object.entries(currentColorVariables).reduce((acc, [variable, color]) => {
    const variableName = colorsMapping[color.toLocaleLowerCase()]?.variableName ?? color ;
    acc[`var(${variable})`] = {updatedColor: '', variableName: `${variableName}`};
    return acc;
}, {} as Record<string, {updatedColor: string, variableName: string}>);

const missedApplicationColors = applicationColors.colorVariables.filter(color => !colorsMapping[color]?.updatedColor);
const approximatedColors = treeShakeColors(missedApplicationColors, Object.keys(litmosFigmaColorMapping)).reduce((acc, color) => {
  const colorIsAvailableInMapping = colorsMapping[color.variable]?.updatedColor;
  if (colorIsAvailableInMapping) return acc;

  const variableName = litmosFigmaColorMapping[color.hex] ?? ('--litmos-new-'+(new Colord('#'+color.hex).toName({ closest: true }) || 'unknown')+'-color') ;
  acc[color.variable] = {updatedColor: color.hex, variableName: `${variableName}`};

  return acc;
}, {} as Record<string, {updatedColor: string, variableName: string}>);

fs.writeFileSync(path.join(__dirname, "files/litmos_variables_updated.css"),
 `:root { \n${Object.keys(colorsMapping)
    .map((currentColor, i) => `  ${colorsMapping[currentColor].variableName}: #${colorsMapping[currentColor].updatedColor};\n  --previous-color-${i}: ${currentColor};`).join("\n")}\n }`);

    
const countUpdatedColors = new Set(Object.values(colorsMapping).map(({updatedColor}) => updatedColor));

console.log(`Total updated colors: ${Object.keys(colorsMapping).length}`);

fs.writeFileSync(path.join(__dirname, "files/litmos_current_theme.css"),
`:root{\n${Array.from(countUpdatedColors).map((color, i) => (litmosFigmaColorMapping[color] ?? ('--litmos-new-'+(new Colord('#'+color).toName({ closest: true }) || 'unknown')+'-color'))+': #'+color+';').sort().join("\n")}\n}`);

fs.writeFileSync(path.join(__dirname, "files/litmos_variables_updated.json"), JSON.stringify({...colorsMapping, ...variableMapping, ...approximatedColors}, null, 2));

console.log(`Total updated colors: ${countUpdatedColors.size}`);