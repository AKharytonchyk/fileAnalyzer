import fs from "fs";

// get files from aspx, ascx, cshtml, and html files
const getCssFilesFromCSharp = (csharpFile: string): string[] => {
    const files: string[] = [];
    const content = fs.readFileSync(csharpFile, "utf-8");
    const lines = content.split("\n");
    
    // <link rel="stylesheet" type="text/css" href="<%=LitmosCommon.ApplicationCore.StaticContent1("css/fullscreen_module.css") %>" />
    // <link rel="stylesheet" href="<%=Url.Content("~/static/css/brand-dashboard-selector.css")%>"/>
    lines.forEach((line) => {
        const match = line.match(/href="(.+\.css)"/);
        if (match) {
          files.push(match[1]);
        }
    });
    return files;
}

const getHtmlFiles = (filePath: string): string[] => {
    const files = fs.readdirSync(filePath);
    let result: string[] = [];
    files.forEach((file) => {
        const fullPath = filePath + "/" + file;
        if (fs.statSync(fullPath).isDirectory()) {
            result = result.concat(getHtmlFiles(fullPath));
        }
        if (file.endsWith(".html" || file.endsWith(".aspx") || file.endsWith(".ascx") || file.endsWith(".cshtml"))) {
            result.push(fullPath);
        }
    });
    return result;
};

export const getCssFilesFromHtml = (filePath: string): string[] => {
    const htmlFiles = getHtmlFiles(filePath);
    let result: string[] = [];
    htmlFiles.forEach((file) => {
        result = result.concat(getCssFilesFromCSharp(file));
    });
    return result;
};
