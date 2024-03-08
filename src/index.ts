import fs from "fs";
import path from "path";

const filePath = process.argv[2];
const outputJson = path.join(__dirname, "output.json");

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
      result.push(fullPath);
    }
  });
  return result;
};

interface FileScan {
  filePath: string;
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
        foundLines: [],
      };

      const lines = content.split("\n");

      lines.forEach((line, index) => {
        if (line.match(/#[0-9a-fA-F]{6}/g) || line.match(/#[0-9a-fA-F]{3}/g)) {
          fileScanResult.foundLines.push({
            lineNumber: index + 1,
            lineContent: line,
          });
        }
      });

      if(fileScanResult.foundLines.length < 1) return acc;

      return acc.concat(fileScanResult);
    }, [] as FileScan[]);

  const csvOutput = output.flatMap((file) => file.foundLines.map((line) => `${file.filePath}, ${line.lineNumber}, ${line.lineContent.trim()}`));
  csvOutput.unshift("File Path, Line Number, Line Content");


  fs.writeFileSync(path.join(__dirname, "output.csv"), csvOutput.join("\n"));
  fs.writeFileSync(outputJson, JSON.stringify(output, null, 2));
};

const cssFiles = findCSSFiles(filePath);
const colors = scanCSSFiles(cssFiles);
