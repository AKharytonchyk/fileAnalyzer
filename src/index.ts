// get path from call params
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
  const output = files.reduce((acc: FileScan[], file) => {
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

    return acc.concat(fileScanResult);
  }, [] as FileScan[]);

  fs.writeFileSync(outputJson, JSON.stringify(output, null, 2));
};

const cssFiles = findCSSFiles(filePath);
const colors = scanCSSFiles(cssFiles);
