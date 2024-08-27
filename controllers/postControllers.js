import { Post } from "../models/postModels.js";
import { User } from "../models/userModels.js";
import path from "path";
import fs from "fs";
import { v4 as uuid } from 'uuid';
import { fileURLToPath } from 'url';

import { HttpError } from "../models/errorModels.js"

const __filename = fileURLToPath(import.meta.url); 
const __dirname = path.dirname(__filename);

// create Post
export const createPost = async (req, res, next) => {
    try {
        let {title, category, description} = req.body;
        if( !title || !category || !description || !req.files){
            return next(new HttpError("Fill in all the fields and choose image",422))
        }
        const {thumbnail} = req.files;
        if(thumbnail.size > 2000000){
            return next(new HttpError("Thumbnail is too big File should be less than 2mb"))
        }
        let fileName = thumbnail.name;
        let splittedFilename = fileName.split('.')
        let newFilename = splittedFilename[0] + uuid() +'.' + splittedFilename[splittedFilename.length - 1]
        thumbnail.mv(path.join(__dirname, '..', '/uploads', newFilename), async (err) => {
            if(err){
                return next(new HttpError(err))
            } else {
                const newPost = await Post.create({title, category, description, thumbnail: newFilename, creator: req.user.id})
                if(!newPost){
                    return next(new HttpError("Post couldn't be created",422))
                }
                //  find user and increment post count by 1
                const currentUser = await User.findById(req.user.id);
                const userPostCount = currentUser.posts + 1;
                await User.findByIdAndUpdate(req.user.id, { posts: userPostCount })
                res.status(201).json(newPost)
            }
        })
    } catch (error) {
        return next(new HttpError(error))
    }
}

// Get Post
export const getPosts = async (req, res, next) => {
    try {
        const posts = await Post.find().sort({updatedAt : -1})
        res.status(200).json(posts)
    } catch (error) {
        return next(new HttpError(error))
    }
}

// Get single Post
export const getPost = async (req, res, next) => {
    try {
        const postId = req.params.id;
        const post = await Post.findById(postId);
        if(!post){
            return next(new HttpError("Post Not Found ,404"))
        }
        res.status(200).json(post)
    } catch (error) {
        return next(new HttpError(error))
    }
}

// get Post by User
export const getUserPosts = async (req, res, next) => {
    try {
        const { id } = req.params;
        const posts = await Post.find({creator: id}).sort({createdAt: -1})
        res.status(200).json(posts)
    } catch (error) {
        return next(new HttpError(error))
    }
}

// get Post by category
export const getCatPosts = async (req, res, next) => {
    try {
        const { category } = req.params;
        const catPosts = await Post.find({category}).sort({createdAt: -1})
        res.status(200).json(catPosts)
    } catch (error) {
        return next(new HttpError(error))
    }
}

// Edit Post
export const editPost = async (req, res, next) => {
    try {
        let fileName;
        let newFilename;
        let updatePost;
        const postId = req.params.id;
        let {title, category, description} = req.body;
        if(!title || !category || description.length < 12){
            return next(new HttpError("Fill in all fields",422))
        }
        if(!req.files){
            updatePost = await Post.findByIdAndUpdate(postId, {title, category, description}, {new: true})
        } else {
            // get post from database
            const oldPost = await Post.findById(postId);
            if(req.user.id == oldPost.creator){
            // delete the old thumbnail from upload
            fs.unlink(path.join(__dirname, '..', 'uploads', oldPost.thumbnail), async (err) => {
                if(err){
                    return next(new HttpError(err))
                }
            })
            // upload new thumbnail
            const {thumbnail} = req.files
            if(thumbnail.size > 2000000 ){
                return next(new HttpError("Thumbnail is too big. Should be less than 2mb"))
            }
            fileName = thumbnail.name;
            let splittedFilename = fileName.split('.')
            newFilename = splittedFilename[0] + uuid() + '.' + splittedFilename[splittedFilename.length -1]
            thumbnail.mv(path.join(__dirname, '..', 'uploads', newFilename), async (err) =>{
                if(err){
                    return next(new HttpError(err))
                }
            
            })
            updatePost = await Post.findByIdAndUpdate(postId, {title, category, description, thumbnail: newFilename}, {new: true})
        }
    }
        if(!updatePost){
                            // upload new thumbnail
                const {thumbnail} = req.files
                if(thumbnail.size > 5000000 ){
                    return next(new HttpError("Thumbnail is too big. Should be less than 5mb"))
                }
                fileName = thumbnail.name;
                let splittedFilename = fileName.split('.')
                newFilename = splittedFilename[0] + uuid() + splittedFilename[splittedFilename.length -1]
                thumbnail.mv(path.join(__dirname, '..', 'uploads', newFilename), async (err) =>{
                    if(err){
                        return next(new HttpError(err))
                    }

                })
                updatePost = await Post.findByIdAndUpdate(postId, {title, category, description, thumbnail: newFilename}, {new: true})
        }
        if(!updatePost){
            return next(new HttpError("Couldn't update post , 400"))
        }
        res.status(200).json(updatePost)
    } catch (error) {
        return next(new HttpError(error))
}
}

// Delete Post
export const deletePost  = async (req, res, next) => {
    try {
        const postId = req.params.id;
        if(!postId){
            return next(new HttpError("Post Unavailable",400))
        }
        const post = await Post.findById(postId);
        const fileName = post?.thumbnail;
        if(req.user.id == post.creator){
        // delete thumbnail from uploads folder
        fs.unlink(path.join(__dirname, '..', 'uploads', fileName), async (err) => {
            if(err){
                return next(new HttpError(err))
            } else {
                await Post.findByIdAndDelete(postId)
                // find user and reduce post count
                const currentUser = await User.findById(req.user.id);
                const userPostCount = currentUser?.posts - 1;
                await User.findByIdAndUpdate(req.user.id, {posts: userPostCount})
                res.json(`Post ${postId} deleted successfully`)
            }
        })
    }else {
        return next(new HttpError("Post couldn't be deleted",403))
    }
        
    } catch (error) {
        return next(new HttpError(error))
    }
}
