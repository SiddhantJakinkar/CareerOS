import mongoose, { Document, Schema } from 'mongoose';

export interface IJob extends Document {
  externalId: string;
  title: string;
  company: string;
  companyWebsite?: string;
  companyIndustry?: string;
  companySize?: string;
  location: string;
  salary?: string;
  salaryMin?: number;
  salaryMax?: number;
  experience: string;
  jobType: string;
  workMode: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  skills: string[];
  source: 'remotive' | 'arbeitnow' | 'jsearch' | 'adzuna' | 'remoteok' | 'manual';
  publisher?: string;
  applyUrl?: string;
  deadline?: Date;
  isTrending: boolean;
  viewCount: number;
  postedAt: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const jobSchema = new Schema<IJob>(
  {
    externalId: { type: String, required: true },
    title: { type: String, required: true, index: true },
    company: { type: String, required: true, index: true },
    companyWebsite: String,
    companyIndustry: String,
    companySize: String,
    location: { type: String, required: true, index: true },
    salary: String,
    salaryMin: Number,
    salaryMax: Number,
    experience: { type: String, default: '0-2 years' },
    jobType: { type: String, default: 'full-time' },
    workMode: { type: String, default: 'hybrid' },
    description: { type: String, required: true },
    requirements: { type: [String], default: [] },
    responsibilities: { type: [String], default: [] },
    benefits: { type: [String], default: [] },
    skills: { type: [String], default: [] },
    source: {
      type: String,
      enum: ['remotive', 'arbeitnow', 'jsearch', 'adzuna', 'remoteok', 'manual'],
      required: true,
    },
    publisher: { type: String, index: true },
    applyUrl: String,
    deadline: Date,
    isTrending: { type: Boolean, default: false },
    viewCount: { type: Number, default: 0 },
    postedAt: { type: Date, default: Date.now },
    expiresAt: Date,
  },
  { timestamps: true }
);

jobSchema.index({ externalId: 1, source: 1 }, { unique: true });
jobSchema.index({ title: 'text', company: 'text', description: 'text' });

export const Job = mongoose.model<IJob>('Job', jobSchema);
