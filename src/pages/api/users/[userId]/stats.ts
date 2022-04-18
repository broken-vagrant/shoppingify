import { NextApiRequest, NextApiResponse } from "next"
import { oneYearBackTimestamp } from "~/constants"
import prisma from "~/lib/prisma"
import checkAuth from "~/middleware/checkAuth"
import { handleError } from "~/utils/api/error"

const converRecordToArray = (
  value: Record<string, { [key: string]: any }>,
  _keyName?: string
) => {
  const keyName = _keyName || "name"
  return Object.entries(value).map(([name, obj]) => ({
    [keyName]: name,
    ...obj,
  }))
}
export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { method } = req
    switch (method) {
      case "GET":
        {
          const loggedUser = checkAuth(req)

          const lists = await prisma.shoppingList.findMany({
            where: {
              userId: loggedUser.id,
              status: "completed",
            },
            include: {
              shoppingItems: true,
            },
          })
          const _data = lists.reduce(
            (acc, curr) => {
              let updatedAt = new Date(curr.updatedAt) // user will update the list when items bought
              for (const item of curr.shoppingItems) {
                if (!item.itemPurchased) {
                  continue
                }
                const { quantity, itemCategory, itemName } = item
                // item wise
                acc.byItem[itemName] = acc.byItem[itemName] || {
                  quantity: 0,
                }
                acc.byItem[itemName].quantity += quantity
                // category wise
                acc.byCategory[itemCategory] = acc.byCategory[itemCategory] || {
                  quantity: 0,
                }
                acc.byCategory[itemCategory].quantity += quantity

                // month wise
                // consider only last 12 months
                if (updatedAt.getTime() > oneYearBackTimestamp) {
                  const month = new Intl.DateTimeFormat("en-US", {
                    month: "long",
                  }).format(updatedAt)
                  acc.byMonth[month] = acc.byMonth[month] || {
                    quantity: 0,
                  }
                  acc.byMonth[month].quantity += quantity
                }
              }
              return acc
            },
            {
              byMonth: {},
              byItem: {},
              byCategory: {},
            } as {
              byMonth: Record<string, { quantity: number }>
              byCategory: Record<string, { quantity: number }>
              byItem: Record<string, { quantity: number }>
            }
          )
          const data: any = {}
          data.byItem = converRecordToArray(_data.byItem, "itemName").slice(
            0,
            3
          )
          data.byCategory = converRecordToArray(
            _data.byCategory,
            "categoryName"
          ).slice(0, 3)
          data.byMonth = converRecordToArray(_data.byMonth, "month").slice(0, 3)
          res.status(200).json({
            data,
          })
        }
        break
      default:
        res.setHeader("Allow", ["GET"])
        res.status(405).end(`Method ${method} Not Allowed`)
    }
  } catch (error) {
    handleError(error, res)
  }
}
