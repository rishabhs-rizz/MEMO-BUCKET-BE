"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("./config");
const zod_1 = require("zod");
const bcrypt_1 = __importDefault(require("bcrypt"));
const db_1 = require("./db");
const middlewares_1 = require("./middlewares");
const utils_1 = require("./utils");
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
app.post("/api/v1/signup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const requiredBody = zod_1.z.object({
        username: zod_1.z.string().min(5).max(30),
        password: zod_1.z.string().min(3).max(30),
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
    const hashedPass = yield bcrypt_1.default.hash(password, 5); // Hash the password first
    try {
        yield db_1.UserModel.create({
            username: username,
            password: hashedPass, // Use the hashed password here
        });
        res.json({
            message: "signed up successful",
        });
    }
    catch (e) {
        res.json({
            message: "user already exists",
        });
    }
}));
app.post("/api/v1/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const username = req.body.username;
        const password = req.body.password;
        const ExistingUser = yield db_1.UserModel.findOne({
            username,
        });
        if (ExistingUser) {
            const token = jsonwebtoken_1.default.sign({
                id: ExistingUser._id,
            }, config_1.JWT_SECRET);
            res.json({
                token: token,
                message: "bery well signed in Mr.",
            });
        }
    }
    catch (e) {
        res.json({
            message: "incorrect credentials",
        });
    }
}));
app.post("/api/v1/content", middlewares_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const title = req.body.title;
    const link = req.body.link;
    const ContentType = req.body.ContentType; // youtube or twitter
    console.log("ContentType", ContentType);
    yield db_1.ContentModel.create({
        link,
        title,
        userId: req.userId,
        ContentType,
    });
    const requiredCardContent = yield db_1.ContentModel.findOne({
        link,
        title,
        userId: req.userId,
    });
    res.json({
        link: requiredCardContent === null || requiredCardContent === void 0 ? void 0 : requiredCardContent.link,
        CardID: requiredCardContent === null || requiredCardContent === void 0 ? void 0 : requiredCardContent._id,
        type: requiredCardContent === null || requiredCardContent === void 0 ? void 0 : requiredCardContent.ContentType,
        title: requiredCardContent === null || requiredCardContent === void 0 ? void 0 : requiredCardContent.title,
        id: requiredCardContent === null || requiredCardContent === void 0 ? void 0 : requiredCardContent.userId,
    });
}));
app.get("/api/v1/content", middlewares_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.userId;
    const content = yield db_1.ContentModel.find({
        userId: userId,
    }).populate("userId", "username");
    if (content) {
        res.json({
            content,
        });
    }
}));
app.delete("/api/v1/content", (req, res) => {
    const contentId = req.body.contentId; // <- Read from body
    db_1.ContentModel.deleteOne({ _id: contentId })
        .then(() => {
        res.json({ message: "Content deleted successfully" });
    })
        .catch((error) => {
        console.error("Error deleting content:", error);
        res.status(500).json({ message: "Error deleting content" });
    });
});
app.post("/api/v1/brain/share", middlewares_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const link = (0, utils_1.Random)(10);
    try {
        const existing = yield db_1.LinkModel.findOne({ userId: req.userId });
        if (existing) {
            res.json({
                message: "link already exists",
                link: existing.hash,
            });
        }
        else {
            const newLink = yield db_1.LinkModel.create({
                userId: req.userId,
                hash: link,
            });
            res.json({
                message: "link created",
                link: newLink.hash,
            });
        }
    }
    catch (e) {
        console.log(e);
        res.json({
            message: "link already exists",
        });
    }
}));
app.get("/api/v1/brain/:shareLink", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const hash = req.params.shareLink;
    console.log("Fetching shared brain with hash:", hash);
    const LinkEntryinDB = yield db_1.LinkModel.findOne({
        hash,
    });
    if (!LinkEntryinDB) {
        res.status(411).json({
            message: "incorrect input",
        });
    }
    const contentEntryinDB = yield db_1.ContentModel.find({
        userId: LinkEntryinDB === null || LinkEntryinDB === void 0 ? void 0 : LinkEntryinDB.userId,
    });
    const userEntentryinDB = yield db_1.UserModel.findOne({
        _id: LinkEntryinDB === null || LinkEntryinDB === void 0 ? void 0 : LinkEntryinDB.userId,
    });
    if (!userEntentryinDB) {
        res.status(411).json({
            message: "user not found, error should ideally not happen",
        });
    }
    res.json({
        username: userEntentryinDB === null || userEntentryinDB === void 0 ? void 0 : userEntentryinDB.username,
        content: contentEntryinDB,
    });
}));
app.get("/api/v1/brain/content/:contentType", middlewares_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const contentType = req.params.contentType;
        console.log("Fetching content of type:", contentType);
        console.log("User ID:", req.userId);
        const content = yield db_1.ContentModel.find({
            userId: req.userId,
            ContentType: contentType,
        });
        if (content.length === 0) {
            res.status(404).json({
                message: "No content found for this type",
            });
            return;
        }
        res.json({ content });
    }
    catch (error) {
        console.error("Error fetching content:", error);
        res.status(500).json({
            message: "Failed to fetch content. Please try again later.",
        });
    }
}));
function Main() {
    return __awaiter(this, void 0, void 0, function* () {
        yield mongoose_1.default.connect("mongodb+srv://rishabhshukla2924:rish7985@cluster0.bmmtb.mongodb.net/SecondBrain-app");
        app.listen(3000);
    });
}
Main();
