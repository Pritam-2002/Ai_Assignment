import { Request, Response } from 'express';
import mongoose from 'mongoose';

export const getDataFromCollection = async (req: any, res: any) => {
    const { collectionName } = req.params;

    const allowedCollections = ['clients', 'workers', 'tasks'];
    if (!allowedCollections.includes(collectionName)) {
        return res.status(400).json({ error: 'Invalid collection name' });
    }

    try {
        const collection = mongoose.connection.collection(collectionName);
        const data = await collection.find().toArray();

        res.status(200).json({
            collection: collectionName,
            count: data.length,
            data,
        });
    } catch (error: any) {
        console.error(`❌ Error fetching from ${collectionName}:`, error);
        res.status(500).json({ error: 'Failed to fetch data', detail: error.message });
    }
};
