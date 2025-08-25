import { Schema, model } from "mongoose";

const roleSchema = Schema({
  name: {
    type: String,
    upperCase: true,
    trim: true,
    required: [true, "Role is a required."],
    enum: ["SUPERADMIN", "ADMIN", "USER"]
  }
}, { timeStamps: true });

export const Role = model("Role", roleSchema);