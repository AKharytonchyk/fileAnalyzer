import fs from 'fs';
import path from 'path';


const colors = fs.readFileSync(path.join(__dirname, './files/missingColorVars.txt'), 'utf-8');
const colorSet = new Set(colors.split('\n').filter((color) => /(#|rgb)/.test(color)).map((color) => color.trim()));

const hexFile = fs.readFileSync(path.join(__dirname, './files/converted_color_variables.css'), 'utf-8');
const rgbFile = fs.readFileSync(path.join(__dirname, './files/custom_color_variables.css'), 'utf-8');

let foundColors = 0;

colorSet.forEach((color) => {  
  hexFile.split('\n').forEach((line) => {
    if (line.includes(color)) {
      console.log(line + ' - ' + color);
      foundColors++;
    }
  });

  rgbFile.split('\n').forEach((line) => {
    if (line.includes(color)) {
      console.log(line + ' - ' + color);
      foundColors++;
    }
  });
})

console.log("Found " + foundColors + " colors");
console.log("Total colors: " + colorSet.size);