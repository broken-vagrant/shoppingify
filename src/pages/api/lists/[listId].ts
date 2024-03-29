import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "~/lib/prisma";
import checkAuth from "~/middleware/checkAuth";
import { ClientError, handleError } from "~/utils/api/error";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { method } = req;
    const { listId: rawListId } = req.query;

    if (!rawListId) throw new ClientError("invalid request parameters");
    const listId = Number(rawListId);

    const loggedUser = checkAuth(req);

    switch (method) {
      case "GET":
        {
          const list = await prisma.shoppingList.findFirst({
            where: {
              id: listId,
            },
            include: {
              shoppingItems: true,
            },
          });
          if (!list) throw new ClientError("list not found");
          res.status(200).json({ data: list });
        }
        break;
      case "PATCH":
        {
          const { status, name, items: rawItems } = req.body;
          const list = await prisma.shoppingList.findFirst({
            where: {
              id: listId,
            },
          });
          if (!list) throw new ClientError("list not found");

          let itemIds;
          const assignedAt = new Date().toISOString();
          if (rawItems && rawItems.length !== 0) {
            itemIds = rawItems.map(({ shoppingItemId, ...updates }) => ({
              where: {
                shoppingListId_shoppingItemId: {
                  shoppingListId: listId,
                  shoppingItemId,
                },
              },
              update: {
                ...updates,
              },
              create: {
                ...updates,
                assignedAt,
                assignedBy: loggedUser.id,
                shoppingItem: {
                  connect: {
                    id: shoppingItemId,
                  },
                },
              },
            }));
          }
          const updatedList = await prisma.shoppingList.update({
            where: {
              id: listId,
            },
            data: {
              status,
              name,
              shoppingItems: itemIds
                ? {
                    upsert: itemIds,
                  }
                : undefined,
            },
          });
          res.status(200).json({ data: updatedList });
        }
        break;
      case "DELETE":
        {
          // when list gets deleted, remove all related records from
          // ShoppingItemToList (junction table)
          await prisma.shoppingItemToList.deleteMany({
            where: {
              shoppingListId: listId,
            },
          });
          await prisma.shoppingList.delete({
            where: {
              id: listId,
            },
          });
          res.status(200).json({
            data: "success",
          });
        }
        break;
      default:
        res.setHeader("Allow", ["GET", "PATCH", "DELETE"]);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    handleError(error, res);
  }
}
