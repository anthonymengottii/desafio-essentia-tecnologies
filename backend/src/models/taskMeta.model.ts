import mongoose, { Schema, InferSchemaType } from "mongoose";

const activitySchema = new Schema(
  {
    action: { type: String, required: true },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const taskMetaSchema = new Schema(
  {
    taskId: { type: Number, required: true, unique: true, index: true },
    tags: { type: [String], default: [] },
    notes: { type: String },
    activityLog: { type: [activitySchema], default: [] },
  },
  { timestamps: true }
);

export type TaskMeta = InferSchemaType<typeof taskMetaSchema>;

export const TaskMetaModel = mongoose.model("TaskMeta", taskMetaSchema);
