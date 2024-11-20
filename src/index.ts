import express, { Response, Request } from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import connectToDatabase from "./schema/db";
import bcrypt from "bcrypt"
import { ContentModel, UserModel } from "./schema/schema";
import { authMiddleware } from "./middlewware";
import dotenv from 'dotenv';
dotenv.config(); // Loads .env variables into process.env
console.log(process.env.JWT_SECRET);
const app = express();
const PORT = 3000;

app.use(express.json());

connectToDatabase().then(() => {
    console.log("DB connected");
}).catch((error) => {
    console.error("Error connecting to the database:", error);
});


// @ts-ignore
app.post("/api/v1/signup", async (req: Request, res: Response): Promise<Response> => {
    const { username, password } = req.body;

    try {
        // Check if user already exists
        const existingUser = await UserModel.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: "Username already exists" });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create and save the user
        const user = new UserModel({ username, password: hashedPassword });
        await user.save();

        return res.status(201).json({ message: "User registered successfully", user });
    } catch (error) {
        return res.status(500).json({ message: "Error registering user", error });
    }
});
// @ts-ignore
app.post("/api/v1/signin", async (req: Request, res: Response): Promise<Response> => {
    const { username, password } = req.body;

    try {
        // Check if user exists
        const user = await UserModel.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: "Invalid username or password" });
        }

        // Compare the password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid username or password" });
        }

        // Generate JWT token
        // @ts-ignore
        const token = jwt.sign({ id: user._id },process.env.JWT_SECRET, { expiresIn: "1h" });

        return res.status(200).json({ message: "User signed in successfully", token });
    } catch (error) {
        return res.status(500).json({ message: "Error signing in user", error });
    }
});
//@ts-ignore
app.post("/api/v1/content", authMiddleware ,async (req: Request, res: Response) => {
    const { title, link, type } = req.body;

    if (!title || !link || !type) {
        return res.status(400).json({ message: "Title, link, and type are required." });
      }

    // @ts-ignore
    console.log(req.user);
    //@ts-ignore
    if (!req.user) {
        return res.status(400).json({ message: "User not authenticated" });
      }
    await ContentModel.create({
        title,
        link,
        type,
        //@ts-ignore
        userId: req.user,
        tags: []
    })

    res.status(200).json({ message: "Content created" });
});


//@ts-ignore
app.get("/api/v1/content", authMiddleware,async (req: Request, res: Response) => {
    //@ts-ignore
    const userId = req.user;
    //@ts-ignore
    if (!req.user) {
        return res.status(400).json({ message: "User not authenticated" });
      }
    const content = await ContentModel.find({
        userId: userId
    }).populate("userId", "username")
   
    res.status(200).json({ message: "Content retrieved",content });
});

app.delete("/api/v1/content", (req: Request, res: Response) => {
    // Implement content deletion logic here
    res.status(200).json({ message: "Content deleted" });
});

app.post("/api/v1/brain/share", (req: Request, res: Response) => {
    // Implement brain share logic here
    res.status(200).json({ message: "Brain shared" });
});

app.get("/api/v1/brain/:shareLink", (req: Request, res: Response) => {
    // Implement brain retrieval logic here
    res.status(200).json({ message: "Brain retrieved" });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
