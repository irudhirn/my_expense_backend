import bcrypt from "bcryptjs";
import crypto from "crypto";

const generatePassword = async (password) => {
  return await bcrypt.hash(password, 12);
}

export const generateRandomPassword = () => {
  const randomPassword = crypto.randomBytes(8).toString('hex');

  console.log("randomPassword", randomPassword);

  return randomPassword;
}

export default generatePassword;