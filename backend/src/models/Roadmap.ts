import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IRoadmapWeek {
  week: number;
  title: string;
  topics: string[];
  resources: string[];
  projects: string[];
  completed: boolean;
}

export interface IRoadmap extends Document {
  userId: Types.ObjectId;
  targetRole: string;
  weeks: IRoadmapWeek[];
  totalWeeks: number;
  progress: number;
  skillGaps: string[];
  createdAt: Date;
  updatedAt: Date;
}

const roadmapSchema = new Schema<IRoadmap>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    targetRole: { type: String, required: true },
    weeks: [
      {
        week: Number,
        title: String,
        topics: [String],
        resources: [String],
        projects: [String],
        completed: { type: Boolean, default: false },
      },
    ],
    totalWeeks: { type: Number, default: 0 },
    progress: { type: Number, default: 0 },
    skillGaps: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const Roadmap = mongoose.model<IRoadmap>('Roadmap', roadmapSchema);
