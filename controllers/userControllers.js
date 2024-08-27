import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path'
import { v4 as uuid } from 'uuid';
import { fileURLToPath } from 'url';

import { HttpError } from "../models/errorModels.js"
import { User } from "../models/userModels.js";

const __filename = fileURLToPath(import.meta.url); 
const __dirname = path.dirname(__filename);

// Register
export const registerUser = async (req, res, next) => {
    try {
        const { name, email, password, password2} = req.body;
        if( !name || !email || !password){
            return next(new HttpError(" Fill in all fields",422))
        }

        const newEmail = email.toLowerCase()
        const emailExists = await User.findOne({email : newEmail})
        if(emailExists){
            return next(new HttpError("Email Already Exists",422))
        }
        if((password.trim()).length < 6){
            return next(new HttpError("Password Should be Atleast 6 Characters",422))
        }

        if(password != password2 ){
            return next(new HttpError("Passwords Does not match",422))
        }

        const salt = await bcrypt.genSalt(10)
        const hashedPass = await bcrypt.hash(password,salt)
        const newUser = await User.create({name, email: newEmail, password: hashedPass})
        res.status(201).json(`New User ${newUser.email} Registered`)
        
    } catch (error) {
        return next( new HttpError("User Registration Failed", 422))
        
    }
}

//login
export const loginUser = async (req, res, next) => {
    try {
        const {email, password} = req.body;
        if( !email || !password){
            return next( new HttpError("Fill in all the fields", 422))
        }
        const newEmail = email.toLowerCase();

        const user = await User.findOne({email: newEmail})
        if(!user){
            return next( new HttpError("Invalid Credentials", 422))
        }
        const comparePass = await bcrypt.compare(password,user.password)
        if(!comparePass){
            return next( new HttpError("Invalid Credentials", 422))
        }

        const {_id: id, name} = user;
        const token = jwt.sign({id, name}, process.env.JWT_SECRET, {expiresIn : "1d"})
        res.status(200).json({token, id, name})


    } catch (error) {
        return next( new HttpError("Login failed. Please check your credentials", 422))
    }
}

//user Profile
export const getUser = async (req, res, next) => {
    try {
        const {id} = req.params;
        const user = await User.findById(id).select('-password')
        if(!user){
            return next( new HttpError("User Not Found", 422))
        }
        res.status(200).json(user);
    } catch (error) {
        return next( new HttpError(error))
    }
}

//change user avatar
export const changeAvatar = async (req, res, next) => {
    try {
        if(!req.files.avatar){
            return next( new HttpError("Please choose an image", 422))
        }

        //find user from database
        const user = await User.findById(req.user.id)
        // delete old avatar if exists
        if(user.avatar){
            fs.unlink(path.join(__dirname,'..', 'uploads', user.avatar),(err) =>{
                if(err){
                    return next( new HttpError(err))
                }
            })
        }
        const { avatar } = req.files;
        // check file size
        if(avatar.size > 600000){
            return next( new HttpError("Profile picture is too big. Should be less than 600kb", 422))
        }

        let fileName;
        fileName =avatar.name;
        let splittedFilename = fileName.split('.')
        let newFilename = splittedFilename[0] + uuid() + '.' + splittedFilename[splittedFilename.length - 1]
        avatar.mv(path.join(__dirname, "..", 'uploads' , newFilename), async (err) => {
            if(err){
                return next( new HttpError(err))
            }

            const updatedAvatar = await User.findByIdAndUpdate(req.user.id, {avatar : newFilename}, {new:true})
            if(!updatedAvatar){
                return next( new HttpError("Avatar Couldn't be changed", 422))
            }
            res.status(200).json(updatedAvatar)
        })
               

    } catch (error) {
        return next( new HttpError(error))
        
    }
}

//Edit user detail
export const editUser = async (req, res, next) => {
    try {
        const { name, email, currentPassword, newPassword, confirmNewPassword } = req.body;
        if(!name || !email || !currentPassword ){
            return next( new HttpError("Fill in all fields",422))
        }
        // get user from database
        const user = await User.findById(req.user.id)
        if(!user){
            return next( new HttpError("User not found",403))
        }

        // make sure email doesn't already exists
        const emailExist = await User.findOne({email})
        if( emailExist && (emailExist._id != req.user.id)){
            return next( new HttpError("Email already exists",422))
        }

        // compare passwords
        const validateUserPassword = await bcrypt.compare(currentPassword, user.password)
        if(!validateUserPassword){
            return next( new HttpError("Invalid Current Password",422))
        }

        // compare new passwords
        if(newPassword !== confirmNewPassword){
            return next( new HttpError("New passwords do not match",422))
        }

        // hash Password
        const salt = await bcrypt.genSalt(10)
        const hash = await bcrypt.hash(newPassword, salt)

        // update User info
        const newInfo = await User.findByIdAndUpdate(req.user.id, {name, email, password: hash}, {new: true})
        res.status(200).json(newInfo)

    } catch (error) {
        return next( new HttpError(`Not working ${error}`))
    }
}

// Get Authors
export const getAuthors = async (req, res, next) => {
    try {
        const authors = await User.find().select('-password')
        res.json(authors)
    } catch (error) {
        return next( new HttpError(error))    
    }
}


