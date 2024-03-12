import fs from "fs";
import path from "path";
import xml2json from "xml2json";
import {cuurentColorVariables} from "./currentColorVariables";

export interface Config {
  scripts: Scripts;
}

export interface Scripts {
  bundles: Bundles;
}

export interface Bundles {
  bundle: Bundle[];
}

export interface Bundle {
  name:  string;
  debug: Debug;
  prod:  Debug;
}

export interface Debug {
  file: FileElement[] | FileElement;
}

export interface FileElement {
  src: string;
}
const cssVariables = Object.keys(cuurentColorVariables).join("|");
const cssVariableRegex = new RegExp(`var\\((${cssVariables})`, "gi");
const regularColorsRegex = /:\s?(black|white|red|green|blue|yellow|orange|pink|purple|brown|gray|grey)/i;

const filePath = process.argv[2];
const scriptConfig = process.argv[3];
const outputJson = path.join(__dirname, "output.json");

const xmlContent = fs.readFileSync(scriptConfig, "utf-8");
const jsonContent = xml2json.toJson(xmlContent);
const parsedJson: Config = JSON.parse(jsonContent);

const fileList = parsedJson.scripts.bundles.bundle.flatMap((bundle) => {
  const debugFiles = bundle.debug.file;
  if (Array.isArray(debugFiles)) {
    return debugFiles.map((file) => ({path: file.src.replace(/\//gi, '\\').replace('\\litmos\\', ''), bundleName: bundle.name}));
  }
  return [{path: debugFiles.src.replace('/', '\\').replace('\\litmos\\', ''), bundleName: bundle.name}];
})

fs.writeFileSync(outputJson, JSON.stringify(fileList, null, 2));

if (!filePath) {
  console.error("No path provided");
  process.exit(1);
}

const findCSSFiles = (filePath: string): string[] => {
  const files = fs.readdirSync(filePath);
  let result: string[] = [];
  files.forEach((file) => {
    const fullPath = path.join(filePath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      result = result.concat(findCSSFiles(fullPath));
    }
    if (file.endsWith(".css")) {
      result.push(fullPath.toLocaleLowerCase());
    }
  });
  return result;
};

interface FileScan {
  filePath: string;
  bundleName: string;
  foundLines: {
    lineNumber: number;
    lineContent: string;
  }[];
}

const scanCSSFiles = (files: string[]) => {
  const output = files
    .filter((file) => !file.endsWith("min.css"))
    .filter((file) => !file.includes("\\bin\\"))
    .filter((file) => !file.includes("Test"))
    .filter((file) => !file.includes("\\ckeditor"))
    .filter((file) => !file.includes("\\jqueryui\\"))
    .reduce((acc: FileScan[], file) => {
      const content = fs.readFileSync(file, "utf-8");
      const fileScanResult: FileScan = {
        filePath: file,
        bundleName: fileList.find((f) => file.includes(f.path))?.bundleName || "",
        foundLines: [],
      };

      const lines = content.split("\n");

      lines.forEach((line, index) => {
        if (
          line.match(/#[0-9a-fA-F]{6}[;,\s]/g)
          || line.match(/#[0-9a-fA-F]{3}[;,\s]/g) 
          || line.match(/rgba?\([0-9]{1,3},[0-9]{1,3},[0-9]{1,3}/g) 
          || line.match(/hsla?\([0-9]{1,3},[0-9]{1,3},[0-9]{1,3}/g) 
          || line.match(/rgb\([0-9]{1,3},[0-9]{1,3},[0-9]{1,3}/g) 
          || line.match(/hsl\([0-9]{1,3},[0-9]{1,3},[0-9]{1,3}/g)
          || line.match(cssVariableRegex)
          || line.match(regularColorsRegex)
          ) {
          fileScanResult.foundLines.push({
            lineNumber: index + 1,
            lineContent: line,
          });
        }
      });

      if(fileScanResult.foundLines.length < 1) return acc;

      return acc.concat(fileScanResult);
    }, [] as FileScan[]);

  const entries = Object.entries(cuurentColorVariables)

  const csvOutput = output.flatMap((file) => file.foundLines.map((line) => `${file.filePath}| ${file.bundleName}| ${line.lineNumber}| ${line.lineContent.trim()}| ${entries.filter(([, value]) => line.lineContent.toLowerCase().includes(value.toLowerCase())).map(([key]) => key).join(",")}`));
  csvOutput.unshift("File Path| Bundle Name| Line Number| Line Content| CSS Variable Name");


  fs.writeFileSync(path.join(__dirname, "output.csv"), csvOutput.join("\n"));
  // fs.writeFileSync(outputJson, JSON.stringify(output, null, 2));
};

const cssFiles = findCSSFiles(filePath);
const colors = scanCSSFiles(cssFiles);
