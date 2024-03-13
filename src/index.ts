import fs from "fs";
import path from "path";
import xml2json from "xml2json";
import { currentColorVariables } from "./currentColorVariables";
import { sortColors } from "./colorMagic";

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
  name: string;
  debug: Debug;
  prod: Debug;
}

export interface Debug {
  file: FileElement[] | FileElement;
}

export interface FileElement {
  src: string;
}
const cssVariables = Object.keys(currentColorVariables).join("|");
const cssVariableRegex = new RegExp(`var\\((${cssVariables})\\)`, "gi");
const regularColorsRegex =
  /:\s?(black|white|red|green|blue|yellow|orange|pink|purple|brown|gray|grey)/i;

const filePath = process.argv[2];
const scriptConfig = process.argv[3];
const outputJson = path.join(__dirname, "output.json");

const xmlContent = fs.readFileSync(scriptConfig, "utf-8");
const jsonContent = xml2json.toJson(xmlContent);
const parsedJson: Config = JSON.parse(jsonContent);

const fileList = parsedJson.scripts.bundles.bundle.flatMap((bundle) => {
  const debugFiles = bundle.debug.file;
  if (Array.isArray(debugFiles)) {
    return debugFiles.map((file) => ({
      path: file.src.replace(/\//gi, "\\").replace("\\litmos\\", ""),
      bundleName: bundle.name,
    }));
  }
  return [
    {
      path: debugFiles.src.replace("/", "\\").replace("\\litmos\\", ""),
      bundleName: bundle.name,
    },
  ];
});

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
    color: string;
    variable: string;
    selector: string;
  }[];
}

const colorCount: Record<string, number> = {};

const variableRecord: Record<string, string> = Object.entries(currentColorVariables).reduce((acc, [key, value]) => {
  acc[value.toLowerCase()] = key.toLowerCase();
  return acc;
}, {} as Record<string, string>);

const scanCSSFiles = (files: string[]) => {
  const colorSet = new Set<string>();
  const output = files
    .filter((file) => !file.endsWith("min.css"))
    .filter((file) => !file.includes("\\bin\\"))
    .filter((file) => !file.includes("jquery"))
    .filter((file) => !file.includes("\\bootstrap.css"))
    .filter((file) => !file.includes("Test"))
    .filter((file) => !file.includes("\\ckeditor"))
    .filter((file) => !file.includes("\\jqueryui\\"))
    .reduce((acc: FileScan[], file) => {
      const content = fs.readFileSync(file, "utf-8");
      const fileScanResult: FileScan = {
        filePath: file,
        bundleName:
          fileList.find((f) => file.includes(f.path))?.bundleName || "",
        foundLines: [],
      };

      if(fileScanResult.bundleName === "") return acc;

      const lines = content.split("\n");

      let selector = "";

      lines.forEach((line, index) => {
        if (line.includes("{")) {
          selector = line.split("{")[0] || line.match(/^(.*)\n^{/gi)?.[0] || "";
        }
        const hrefMatches = line.match(/#[0-9a-fA-F]{3,6}[;,\s]/gi)?.map(el=> el.replace(/[;,\s]/, '')) || [];
        const rgbMatches = line.match(/rgba?\(\s?[0-9]{1,3},\s?[0-9]{1,3},\s?[0-9]{1,3}\)/gi) || [];
        const rgbaMatches = line.match(/rgba?\(\s?[0-9]{1,3},\s?[0-9]{1,3},\s?[0-9]{1,3},\s?[0-9,.]{1,9}\)/gi) || [];
        const regularColorsMatches = line.match(regularColorsRegex)?.slice(1) || [];
        const variableMatches = line.match(cssVariableRegex)?.slice(0) || [];

        const matches = [
          ...hrefMatches,
          ...rgbMatches,
          ...rgbaMatches,
          ...regularColorsMatches,
          ...variableMatches,
        ];

        matches.map(match => match.toLowerCase().trim()).forEach((match) => {
          if(colorCount[match]) colorCount[match]++;
          else colorCount[match] = 1;
        });

        matches.map(match => match.toLowerCase().trim()).forEach((match) => {
          if(!variableRecord[match]) colorSet.add(match);
          fileScanResult.foundLines.push({
            lineNumber: index + 1,
            lineContent: line,
            color: match,
            variable: variableRecord[match] || "",
            selector: selector,
          });
        });
      });

      if (fileScanResult.foundLines.length < 1) return acc;

      return acc.concat(fileScanResult);
    }, [] as FileScan[]);

  const entries = Object.entries(currentColorVariables);

  const csvOutput = output.flatMap((file) =>
    file.foundLines.map(
      (line) =>
        `${file.filePath}| ${file.bundleName}| ${line.lineNumber}| ${line.lineContent.trim()}| ${line.selector}| ${entries
          .filter(([, value]) =>
            line.lineContent.toLowerCase().includes(value.toLowerCase())
          )
          .map(([key]) => key)
          .join(",")} | ${line.color} | ${colorCount[line.color]}| ${line.variable}`
    )
  );
  csvOutput.unshift(
    "File Path| Bundle Name| Line Number| Line Content| Selector Name| CSS Variable Name| Color| Color Count| Variable Name"
  );
  fs.writeFileSync(path.join(__dirname, "missingColorVars.txt"), JSON.stringify([...colorSet].join("\n"), null, 2));
  fs.writeFileSync(path.join(__dirname, "output.csv"), csvOutput.join("\n"));
  // fs.writeFileSync(outputJson, JSON.stringify(output, null, 2));
};

const cssFiles = findCSSFiles(filePath);
const colors = scanCSSFiles(cssFiles);


const sortedColors = sortColors(colorCount);
fs.writeFileSync(path.join(__dirname, "files/sorted_colors_with_count.css"), `:root { \n${sortedColors.map(({color, count}, i) => `--color-${i}-${count}: ${color}; /* ${count} */`).join("\n")}\n }`);

