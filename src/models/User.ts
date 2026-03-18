import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  matchPassword(enteredPassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
  firstName: { type: String, required: [true, 'Please provide a first name'] },
  lastName: { type: String, required: [true, 'Please provide a last name'] },
  email: { type: String, required: [true, 'Please provide an email'], unique: true, lowercase: true },
  password: { type: String, required: [true, 'Please provide a password'], minlength: 6, select: false },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
}, { timestamps: true });

// Mongoose 9.x pre-save hook - using type assertion to handle strict typing
(UserSchema as any).pre('save', async function (this: IUser) {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.matchPassword = async function (enteredPassword: string): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default (mongoose.models.User as mongoose.Model<IUser>) || mongoose.model<IUser>('User', UserSchema);
