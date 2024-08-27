import express from 'express';
import cors from 'cors';
import { connect } from 'mongoose';
import dotenv from 'dotenv';
import upload from 'express-fileupload'
import path from 'path'
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url); 
const __dirname = path.dirname(__filename);



import userRoutes from './routes/userRoutes.js';
import postRoutes from './routes/postRoutes.js'
import { errorHandler, notFound } from './middleware/errorMiddleware.js';

dotenv.config()

const app = express();
app.use(express.json({extended: true}))
app.use(express.urlencoded({extended: true}))
app.use(cors({credentials: true, origin: "http://localhost:3000"}))
app.use(upload())
app.use('/uploads', express.static(__dirname + '/uploads'))

app.use('/api/users', userRoutes)
app.use('/api/posts',postRoutes)

app.use(notFound)
app.use(errorHandler)

connect(process.env.MONGO_URI).then(app.listen(process.env.PORT || 5000,() => console.log(`Server Running on Port ${process.env.PORT}`))).catch(error =>{console.log(error)})

