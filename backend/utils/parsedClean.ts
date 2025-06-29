export function parseFixedCleanedData(
    cleaned: any[],
    mapping: Record<string, string>
): any[] {
    const messyKey = Object.keys(cleaned[0])[0];
    const expectedHeaders = Object.values(mapping);
    const expectedColumnCount = expectedHeaders.length;

    return cleaned.map((row) => {
        const rawLine = row[messyKey];


        const parts = rawLine.match(new RegExp(
            `(?:[^\\s"]+\\s+){0,}${expectedColumnCount - 1}[^\\s"]+.*`, 'g'
        ))?.[0].split(/\s{2,}/g) || [];

        const structured: Record<string, any> = {};

        expectedHeaders.forEach((header, idx) => {
            structured[header] = parts[idx] || "";
        });


        let maybeJson = structured["AttributesJSON"] || structured["GroupTag"];

        try {
            const parsed = JSON.parse(maybeJson);
            Object.assign(structured, parsed);
            delete structured["AttributesJSON"];
            delete structured["GroupTag"];
        } catch {

        }

        return structured;
    });
}
