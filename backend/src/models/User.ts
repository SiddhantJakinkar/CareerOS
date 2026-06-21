import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  googleId?: string;
  role: 'user' | 'admin' | 'counselor';
  isEmailVerified: boolean;
  onboardingCompleted: boolean;
  failedLoginAttempts: number;
  lockUntil?: Date;
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
  isLocked: boolean;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, select: false },
    googleId: { type: String, sparse: true },
    role: { type: String, enum: ['user', 'admin', 'counselor'], default: 'user' },
    isEmailVerified: { type: Boolean, default: false },
    onboardingCompleted: { type: Boolean, default: false },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    refreshToken: { type: String, select: false },
  },
  { timestamps: true }
);

userSchema.virtual('isLocked').get(function (this: IUser) {
  return !!(this.lockUntil && this.lockUntil > new Date());
});

export const User = mongoose.model<IUser>('User', userSchema);
