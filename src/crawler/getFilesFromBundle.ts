import fs from "fs";
import xml2json from "xml2json";
import { Config } from "..";


export const getFilesFromBundle = (scriptConfig: string) => {
  const xmlContent = fs.readFileSync(scriptConfig, "utf-8");
  const jsonContent = xml2json.toJson(xmlContent);
  const parsedJson: Config = JSON.parse(jsonContent);

  const fileList = parsedJson.scripts.bundles.bundle.flatMap((bundle) => {
    const debugFiles = bundle.debug.file;
    if (Array.isArray(debugFiles)) {
      return debugFiles.map((file) => ({
        path: file.src.replace(/\//gi, "\\")
          .replace("\\litmos\\", "")
          .replace("[cdn1]", ""),
        bundleName: bundle.name,
      }));
    }
    return [
      {
        path: debugFiles.src.replace(/\//gi, "\\")
        .replace("\\litmos\\", "")
        .replace("[cdn1]", ""),
        bundleName: bundle.name,
      },
    ];
  });

  return fileList;
};
