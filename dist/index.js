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
    else {
        res.json({
            message: "incorrect credentials",
        });
    }
}));
app.post("/api/v1/content", middlewares_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const title = req.body.title;
    const link = req.body.link;
    const ContentType = req.body.ContentType; // youtube or twitter
    yield db_1.ContentModel.create({
        link,
        title,
        userId: req.userId,
        // tags: []
    });
    res.json({
        link,
        type: ContentType,
        title,
        id: req.userId,
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
app.delete("/api/v1/content", (req, res) => { });
app.post("/api/v1/brain/share", middlewares_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const share = req.body.share;
    if (share) {
        const link = (0, utils_1.Random)(10);
        yield db_1.LinkModel.create({
            userId: req.userId,
            hash: link,
        });
        res.json({
            message: "link created",
            link: link,
        });
    }
    else {
        yield db_1.LinkModel.deleteOne({
            userId: req.userId,
        });
        res.json({
            message: "link deleted",
        });
    }
}));
app.get("/api/v1/brain/:shareLink", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const hash = req.params.shareLink;
    const LinkEntryinDB = yield db_1.LinkModel.findOne({
        hash,
    });
    if (!LinkEntryinDB) {
        res.status(411).json({
            message: "incorrect input",
        });
        return;
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
        return;
    }
    res.json({
        username: userEntentryinDB === null || userEntentryinDB === void 0 ? void 0 : userEntentryinDB.username,
        content: contentEntryinDB,
    });
}));
function Main() {
    return __awaiter(this, void 0, void 0, function* () {
        yield mongoose_1.default.connect("mongodb+srv://rishabhshukla2924:rish7985@cluster0.bmmtb.mongodb.net/SecondBrain-app");
        app.listen(3000);
    });
}
Main();
