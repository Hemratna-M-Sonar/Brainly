import express, { Response, Request } from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import connectToDatabase from "./schema/db";
import bcrypt from "bcrypt"
import { ContentModel, UserModel ,LinkModel} from "./schema/schema";
import { authMiddleware } from "./middlewware";
import dotenv from 'dotenv';
import { random } from "./utils";
import cors from 'cors';
dotenv.config(); // Loads .env variables into process.env
console.log(process.env.JWT_SECRET);
const app = express();
app.use(cors())
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
//@ts-ignore
app.delete("/api/v1/content", authMiddleware ,async (req: Request, res: Response) => {
    // Implement content deletion logic here
    const contentId = req.body.contentId;
    console.log(contentId)
    //@ts-ignore
    const userId=req.user
    // console.log(userId)

    await ContentModel.deleteOne({
        _id:contentId,
        userId: userId,
    })
    
    res.status(200).json({ message: "Content deleted" });
});



//@ts-ignore
app.post("/api/v1/brain/share", authMiddleware, async (req: Request, res: Response) => {
    // Implement brain share logic here
    const share = req.body.share;
    //@ts-ignore
    const userId=req.user

    if (share) {
            const existingLink = await LinkModel.findOne({
                userId: userId
            });

            if (existingLink) {
                res.json({
                    hash: existingLink.hash
                })
                return;
            }
            const hash = random(10);
            console.log(hash)
            await LinkModel.create({
                userId: userId,
                hash: hash
            })
            res.json({
                hash
            })
    } else {
        await LinkModel.deleteOne({
            userId: userId
        });

        res.json({
            message: "Removed link"
        })
    }
});

app.get("/api/v1/brain/:shareLink", async (req: Request, res: Response) => {
    // Implement brain retrieval logic here
    const hash = req.params.shareLink;
    const link = await LinkModel.findOne({
        hash
    });

    if (!link) {
        res.status(411).json({
            message: "Sorry incorrect input"
        })
        return;
    }

     // userId
     const content = await ContentModel.find({
        userId: link.userId
    })
    console.log(link);
    const user = await UserModel.findOne({
        _id: link.userId
    })
    if (!user) {
        res.status(411).json({
            message: "user not found, error should ideally not happen"
        })
        return;
    }

    res.status(200).json({
        "message":"Brain get data",
        username: user.username,
        content: content
    })


    // res.status(200).json({ message: "Brain retrieved" });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
