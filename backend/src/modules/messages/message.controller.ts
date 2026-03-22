import { Request, Response } from "express";
import asyncHandler from "../../shared/async-handler";
import { getMessagesByChat } from "./message.service";

export const getMessages = asyncHandler(
  async (req: Request<{ chatId: string }>, res: Response): Promise<void> => {
    const { chatId } = req.params;
    const limit = Number(req.query.limit ?? 50);
    const before = req.query.before as string | undefined;

    const messages = await getMessagesByChat({ chatId, limit, before });

    res.json({
      success: true,
      data: messages,
    });
  }
);
