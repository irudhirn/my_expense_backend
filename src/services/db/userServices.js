import mongoose from "mongoose";
import { User } from "../../models/userModel.js";

class UserServices{
  constructor(){

  }

  async getAllUsers(){
    const users = await User.find().populate("role");

    return users;
  }

  getAllUser(){

  }

  createUser(){

  }

  updateUser(){

  }

  deleteUser(){

  }
}

export default new UserServices();