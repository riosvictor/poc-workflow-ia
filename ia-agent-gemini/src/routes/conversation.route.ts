import express from "express";
import { processMessage, resetConversation } from "../controllers/conversation.controller";

const router = express.Router();

router.post("/", processMessage);
router.delete("/:conversationId", resetConversation);

export default router;
