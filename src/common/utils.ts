export function getJsonData(FilePath: string): Record<string, any> {
    const fs = require('fs');
    const JsonFile = fs.readFileSync(FilePath, 'utf8');
    const JsonData = JSON.parse(JsonFile);
    return JsonData;
}