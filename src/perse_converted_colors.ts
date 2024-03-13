import fs from "fs";

const content = fs.readFileSync("src/files/converted_color_variables.css", "utf-8");

const lines = content.split("\n");
const colorLines = new Set(lines.slice(1, lines.length - 1));

const sortedLinesArray = Array.from(colorLines).sort((a, b) => a.split(":")[0].localeCompare(b.split(":")[0]));

fs.writeFileSync("src/files/sorted_color_variables.css", [lines[0], ...sortedLinesArray, lines[lines.length-1]].join("\n"));
