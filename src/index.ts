import express from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "./config";
import { z } from "zod";
import bcrypt from "bcrypt";
import { ContentModel, LinkModel, UserModel } from "./db";
import { userMiddleware } from "./middlewares";
import { Random } from "./utils";
import cors from "cors";
const app = express();
app.use(express.json());
app.use(cors());

app.post("/api/v1/signup", async (req, res) => {
  const requiredBody = z.object({
    username: z.string().min(5).max(30),
    password: z.string().min(3).max(30),
  });
  const ParesedWithSuccess = requiredBody.safeParse(req.body);
  if (!ParesedWithSuccess) {
    res.json({
      message: "wrong format",
    });
    return;
  }

  const username = req.body.username;
  const password = req.body.password;

  const hashedPass = await bcrypt.hash(password, 5); // Hash the password first

  try {
    await UserModel.create({
      username: username,
      password: hashedPass, // Use the hashed password here
    });
    res.json({
      message: "signed up successful",
    });
  } catch (e) {
    res.json({
      message: "user already exists",
    });
  }
});

app.post("/api/v1/signin", async (req, res) => {
  try {
    const username = req.body.username;
    const password = req.body.password;

    const ExistingUser = await UserModel.findOne({
      username,
    });

    if (ExistingUser) {
      const token = jwt.sign(
        {
          id: ExistingUser._id,
        },
        JWT_SECRET
      );

      res.json({
        token: token,
        message: "bery well signed in Mr.",
      });
    }
  } catch (e) {
    res.json({
      message: "incorrect credentials",
    });
  }
});

app.post("/api/v1/content", userMiddleware, async (req, res) => {
  const title = req.body.title;
  const link = req.body.link;
  const ContentType = req.body.ContentType; // youtube or twitter

  console.log("ContentType", ContentType);

  await ContentModel.create({
    link,
    title,
    userId: req.userId,
    ContentType,
  });

  const requiredCardContent = await ContentModel.findOne({
    link,
    title,
    userId: req.userId,
  });
  res.json({
    link: requiredCardContent?.link,
    CardID: requiredCardContent?._id,
    type: requiredCardContent?.ContentType,
    title: requiredCardContent?.title,
    id: requiredCardContent?.userId,
  });
});

app.get("/api/v1/content", userMiddleware, async (req, res) => {
  const userId = req.userId;
  const content = await ContentModel.find({
    userId: userId,
  }).populate("userId", "username");

  if (content) {
    res.json({
      content,
    });
  }
});

app.delete("/api/v1/content", (req, res) => {
  const contentId = req.body.contentId; // <- Read from body
  ContentModel.deleteOne({ _id: contentId })
    .then(() => {
      res.json({ message: "Content deleted successfully" });
    })
    .catch((error) => {
      console.error("Error deleting content:", error);
      res.status(500).json({ message: "Error deleting content" });
    });
});

app.post("/api/v1/brain/share", userMiddleware, async (req, res) => {
  const link = Random(10);
  try {
    const existing = await LinkModel.findOne({ userId: req.userId });

    if (existing) {
      res.json({
        message: "link already exists",
        link: existing.hash,
      });
    } else {
      const newLink = await LinkModel.create({
        userId: req.userId,
        hash: link,
      });
      res.json({
        message: "link created",
        link: newLink.hash,
      });
    }
  } catch (e) {
    console.log(e);
    res.json({
      message: "link already exists",
    });
  }
});

app.get("/api/v1/brain/:shareLink", async (req, res) => {
  const hash = req.params.shareLink;
  console.log("Fetching shared brain with hash:", hash);
  const LinkEntryinDB = await LinkModel.findOne({
    hash,
  });

  if (!LinkEntryinDB) {
    res.status(411).json({
      message: "incorrect input",
    });
  }

  const contentEntryinDB = await ContentModel.find({
    userId: LinkEntryinDB?.userId,
  });

  const userEntentryinDB = await UserModel.findOne({
    _id: LinkEntryinDB?.userId,
  });
  if (!userEntentryinDB) {
    res.status(411).json({
      message: "user not found, error should ideally not happen",
    });
  }

  res.json({
    username: userEntentryinDB?.username,
    content: contentEntryinDB,
  });
});

async function Main() {
  await mongoose.connect(
    "mongodb+srv://rishabhshukla2924:rish7985@cluster0.bmmtb.mongodb.net/SecondBrain-app"
  );
  app.listen(3000);
}
Main();
