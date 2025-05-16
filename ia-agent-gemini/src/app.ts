import express from "express";
import conversationRoutes from "./routes/conversation.route";

const app = express();
app.use(express.json());

app.use("/conversation", conversationRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`IA Agent listening on port ${PORT}`);
});
