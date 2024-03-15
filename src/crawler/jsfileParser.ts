import * as fs from "fs";

const getCssFromFile = (jsFile: string): string[] => {
  const files: string[] = [];
  const content = fs.readFileSync(jsFile, "utf-8");
  const lines = content.split("\n");

  lines.forEach((line) => {
    const match = line.match(/appendStyleSheet\(.*"(.+\.css)"\)/);
    if (match) {
      files.push(match[1]);
    }
  });
  return files;
}

const getJsFiles = (filePath: string): string[] => {
  const files = fs.readdirSync(filePath);
  let result: string[] = [];
  files.forEach((file) => {
    const fullPath = filePath + "/" + file;
    if (fs.statSync(fullPath).isDirectory()) {
      result = result.concat(getJsFiles(fullPath));
    }
    if (file.endsWith(".js")) {
      result.push(fullPath);
    }
  });
  return result;
};

export const getCssFilesFromJs = (filePath: string): string[] => {
  const jsFiles = getJsFiles(filePath);
  let result: string[] = [];
  jsFiles.forEach((file) => {
    result = result.concat(getCssFromFile(file));
  });
  return result;
};