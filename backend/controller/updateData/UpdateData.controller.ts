import { Request, Response } from "express";
import mongoose from "mongoose";

export const updateEntityById = async (req: any, res: any) => {
    try {
        const { collection, id, update } = req.body;

        if (!collection || !id || !update) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const dbCollection = mongoose.connection.collection(collection);
        const objectId = new mongoose.Types.ObjectId(id);

        const result = await dbCollection.updateOne({ _id: objectId }, { $set: update });

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: "Document not found" });
        }

        res.status(200).json({ message: "Updated successfully", updatedCount: result.modifiedCount });
    } catch (error: any) {
        console.error("Update error:", error);
        res.status(500).json({ error: "Failed to update", detail: error.message });
    }
};
