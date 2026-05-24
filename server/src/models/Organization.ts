import mongoose, { Document, Schema } from 'mongoose';

export interface IOrganization extends Document {
    orgName: string;
    ownerName?: string;
    mobileNumber?: string;
    email: string;
    isEnabled: boolean;
    pushTokens?: string[];
    createdAt: Date;
    updatedAt: Date;
}

const OrganizationSchema: Schema = new Schema({
    orgName: { type: String, required: true },
    ownerName: { type: String },
    mobileNumber: { type: String },
    email: { type: String, required: true, unique: true }, // Used for Admin login matching
    isEnabled: { type: Boolean, default: true },
    pushTokens: [{ type: String }]
}, { timestamps: true });

export default mongoose.model<IOrganization>('Organization', OrganizationSchema);
