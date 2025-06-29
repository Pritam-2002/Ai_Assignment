import fs from 'fs';
import ExcelJS from 'exceljs';
import { getHeaderMapping } from '../../utils/langchain';
import mongoose from 'mongoose';

export const handleFileUpload = async (req: any, res: any) => {
    try {
        const filePath = req.file?.path;
        if (!filePath) return res.status(400).json({ error: "No file uploaded" });

        const isCSV = filePath.toLowerCase().endsWith('.csv');


        let sections: { entityName: string, headers: string[], data: string[][] }[] = [];

        if (isCSV) {
            const csvContent = fs.readFileSync(filePath, 'utf-8');
            const lines = csvContent.trim().split('\n');

            // 🔄 CHANGED: Logic to split by empty lines into multiple CSV sections
            let currentSection: string[][] = [];
            for (let line of lines) {
                const trimmed = line.trim();
                if (trimmed === '') {
                    if (currentSection.length > 0) {
                        sections.push({
                            entityName: 'Entity' + sections.length,
                            headers: currentSection[0],
                            data: currentSection.slice(1)
                        });
                        currentSection = [];
                    }
                } else {
                    const row = line.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''));
                    currentSection.push(row);
                }
            }

            if (currentSection.length > 0) {
                sections.push({
                    entityName: 'Entity' + sections.length,
                    headers: currentSection[0],
                    data: currentSection.slice(1)
                });
            }

        } else {

            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.readFile(filePath);

            workbook.eachSheet((sheet, sheetId) => {
                const raw: string[][] = [];
                sheet.eachRow((row) => {
                    raw.push(row.values.slice(1).map((v: any) => (v ? v.toString() : '')));
                });
                if (raw.length > 0) {
                    sections.push({
                        entityName: sheet.name || `Entity${sections.length}`,
                        headers: raw[0],
                        data: raw.slice(1)
                    });
                }
            });
        }


        const entityMap: Record<string, string> = {
            "Clients 1": "clients",
            "Worker 1": "workers",
            "Tasks 1": "tasks"
        };
        const results: Record<string, any[]> = {};
        const mappings: Record<string, any> = {};

        for (const section of sections) {
            const { entityName, headers, data } = section;
            console.log(`Processing ${entityName} with headers:`, headers);

            const mapping = await getHeaderMapping(headers, data.slice(0, 3));
            const cleanedData = data.map(row => {
                const obj: Record<string, any> = {};
                headers.forEach((oldHeader, idx) => {
                    const newKey = mapping[oldHeader] || oldHeader;
                    obj[newKey] = row[idx];
                });
                return obj;
            });

            results[entityName] = cleanedData;
            mappings[entityName] = mapping;


            const collectionName = entityMap[entityName];
            if (collectionName) {
                const collection = mongoose.connection.collection(collectionName);
                const responseMongo = await collection.insertMany(cleanedData);
                console.log(`Inserted ${responseMongo.insertedCount} documents into ${collectionName}`);
            }
        }


        res.status(200).json({ results, mappings });

    } catch (error: any) {
        console.error("Upload error:", error);
        res.status(500).json({ error: "Processing failed", detail: error.message });
    } finally {
        if (req.file?.path) {
            fs.unlink(req.file.path, () => { });
        }
    }
};
