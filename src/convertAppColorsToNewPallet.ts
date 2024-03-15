import fs from "fs";
import { findCSSFiles } from ".";
import { getFilesFromBundle } from "./crawler/getFilesFromBundle";
import variablesJson from './files/litmos_variables_updated.json';
import { getCssFilesFromJs } from "./crawler/jsfileParser";
import { getCssFilesFromHtml } from "./crawler/htmlFileParser";

const filePath = process.argv[2];
const scriptConfig = process.argv[3];
const cssFiles = findCSSFiles(filePath);
const fileList = getFilesFromBundle(scriptConfig);
const filesFromJs = getCssFilesFromJs(filePath).map((file) => ({path: file.split('/').pop() ?? file, bundleName: "js-files"}));
const filesFromCSharp = getCssFilesFromHtml(filePath).map((file) => ({path: file.split("/").pop() ?? file, bundleName: "csharp-files"}));
fileList.push(...filesFromJs, ...filesFromCSharp)
const variablesRecord = variablesJson as Record<string, {updatedColor: string, variableName: string}>;

const scanCSSFiles = (files: string[]) => {
    files
      .filter((file) => !file.endsWith("min.css"))
      .filter((file) => !file.includes("\\bin\\"))
      .filter((file) => !file.includes("jquery"))
      .filter((file) => !file.includes("\\bootstrap.css"))
      .filter((file) => !file.includes("Test"))
      .filter((file) => !file.includes("\\jqueryui\\"))
      .forEach((file) => {
        const content = fs.readFileSync(file, "utf-8");
        const bundleName = fileList.find((f) => file.includes(f.path))?.bundleName || ""
  
        if(bundleName === "") return;
  
        const lines = content.split("\n");
  
        const escapedRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const newLinesContent = lines.map((line) => {
            let newLine = line;
          Object.keys(variablesRecord).forEach((variable: string) => {
            const cssColorRegExp = new RegExp(`(\\s|:)${escapedRegExp(variable)}(\\s|;)`, 'gi');
            if (cssColorRegExp.test(newLine)) {
              newLine = newLine.replace(cssColorRegExp, `$1var(${variablesRecord[variable].variableName})$2`);
            }
          });
            return newLine;
        }).join("\n");
        fs.writeFileSync(file, newLinesContent);
    });
  };

  scanCSSFiles(cssFiles);