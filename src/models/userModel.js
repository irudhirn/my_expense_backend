import mongoose, { Schema, model } from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const userSchema = Schema({
  firstName: {
    type: String,
    required: [true, "First name is required."],
    trim: true,
    minLength: 2,
    maxLength: 20
  },
  lastName: {
    type: String,
    required: [true, "First name is required."],
    trim: true,
    minLength: 2,
    maxLength: 20
  },
  username: {
    type: String,
    trim: true,
    minLength: 2,
    maxLength: 20,
    unique: true,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    lowerCase: true,
    trim: true,
    minLength: 2,
    maxLength: 40,
    unique: true,
    validate: [validator.isEmail, "Email is invalid."]
  },
  role: {
    type: Schema.Types.ObjectId,
    ref: "Role",
    default: new mongoose.Types.ObjectId("689d005e7928c83d065cc227")
  },
  password: {
    type: String,
    required: [true, "Password is required."],
    trim: true,
    minLength: 6,
    select: false,
    required: [function () { return this.isModified('password'); }, 'Password is required.'], // Password is required during login.
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm a Password."],
    select: false,
    validate: {
      validator: function (el){
        return el === this.password;
      },
      message: "Passwords do not match."
    },
    trim: true
  },
  phone: {
    type: String
  },
  passwordChangedAt: {
    type: Date,
    select: false
  },
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: {
    type: Date,
    select: false
  },
  isDeleted: {
    type: Boolean,
    default: false,
    select: false
  },
  isVerified: {
    type: Boolean,
    default: false,
    select: false
  },
  createdBy: {
    type: String,
    select: false
  },
  imageSmall: String,
  imageMedium: String,
  imageOriginal: String,
  refreshToken: {
    type: String,
    select: false
  }
}, { timestamps: true });

userSchema.pre("save", async function(next){
  if(!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;

  next();
});

userSchema.pre("save", function (next){
  if(!this.isModified("password") || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
})

userSchema.pre(/^find/, function (next){
  this.find({ isDeleted: { $ne: true } });
  
  next();
});

userSchema.methods.isPasswordCorrect = async function (enteredPassword, passwordInDB){
  return await bcrypt.compare(enteredPassword, passwordInDB);
}

userSchema.methods.isPasswordChangedPostLogin = function (JWTIssuedAt){
  if(this.passwordChangedAt){
    const passwordChangedTime = parseInt(this.passwordChangedAt.getTime() / 1000, 10);

    return JWTIssuedAt < passwordChangedTime;
  }
  return false;
}

userSchema.methods.createPasswordResetToken = function (){
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  this.passwordResetExpires = Date.now() + 600000;

  return resetToken;
}

export const User = model("User", userSchema);