import { Schema, model } from "mongoose";

const roleSchema = Schema({
  name: {
    type: String,
    upperCase: true,
    trim: true,
    required: [true, "Role is a required."],
    enum: ["SUPERADMIN", "ADMIN", "ADMIN_REVIEWER", "OWNER", "MANAGER", "USER"],
  },
  type: {
    type: String,
    required: true,
    enum: ["ADMIN_PANEL", "PLATFORM"],
  },
}, { timeStamps: true });

export const Role = model("Role", roleSchema);