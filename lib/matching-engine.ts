import { prisma } from "./prisma";
import { OrderSide, OrderType } from "@prisma/client";

export class MatchingEngine {
  /**
   * Place an order and match it against existing orders
   * YES at probability p matches with NO at probability (1-p)
   */
  static async placeOrder(
    userId: string,
    outcomeId: string,
    side: OrderSide,
    type: OrderType,
    quantity: number,
    price: number
  ) {
    // Validate price is between 0 and 1
    if (price <= 0 || price >= 1) {
      throw new Error("Price must be between 0 and 1");
    }

    // For market orders, we'll match at best available price
    if (type === "MARKET") {
      return this.executeMarketOrder(userId, outcomeId, side, quantity);
    }

    // Create the limit order
    const order = await prisma.order.create({
      data: {
        userId,
        outcomeId,
        side,
        type,
        quantity,
        price,
        status: "OPEN"
      }
    });

    // Try to match the order
    await this.matchOrder(order.id);

    return order;
  }

  /**
   * Execute a market order immediately at best available price
   */
  private static async executeMarketOrder(
    userId: string,
    outcomeId: string,
    side: OrderSide,
    quantity: number
  ) {
    // Get the opposite side orders, best price first
    const oppositeSide = side === "YES" ? "NO" : "YES";
    const oppositeOrders = await prisma.order.findMany({
      where: {
        outcomeId,
        side: oppositeSide,
        status: { in: ["OPEN", "PARTIALLY_FILLED"] }
      },
      orderBy: {
        price: side === "YES" ? "asc" : "desc" // YES wants lowest NO price, NO wants highest YES price
      }
    });

    if (oppositeOrders.length === 0) {
      throw new Error("No orders available to match");
    }

    // Use the best available price
    const bestPrice = side === "YES"
      ? 1 - oppositeOrders[0].price // YES at p matches NO at (1-p)
      : oppositeOrders[0].price;

    const order = await prisma.order.create({
      data: {
        userId,
        outcomeId,
        side,
        type: "MARKET",
        quantity,
        price: bestPrice,
        status: "OPEN"
      }
    });

    await this.matchOrder(order.id);

    return order;
  }

  /**
   * Match an order against existing opposite orders
   */
  private static async matchOrder(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { outcome: true }
    });

    if (!order || order.status === "FILLED" || order.status === "CANCELLED") {
      return;
    }

    let remainingQuantity = order.quantity - order.filled;

    // Get opposite side orders
    const oppositeSide = order.side === "YES" ? "NO" : "YES";

    // For YES orders: we want NO orders where (1 - NO.price) <= YES.price
    // For NO orders: we want YES orders where (1 - NO.price) >= YES.price
    const oppositeOrders = await prisma.order.findMany({
      where: {
        outcomeId: order.outcomeId,
        side: oppositeSide,
        status: { in: ["OPEN", "PARTIALLY_FILLED"] },
        userId: { not: order.userId } // Don't match with own orders
      },
      orderBy: {
        createdAt: "asc" // FIFO matching
      }
    });

    for (const oppositeOrder of oppositeOrders) {
      if (remainingQuantity <= 0) break;

      // Check if prices match
      // YES at p matches NO at (1-p)
      const yesPrice = order.side === "YES" ? order.price : 1 - oppositeOrder.price;
      const noPrice = order.side === "NO" ? order.price : oppositeOrder.price;

      if (Math.abs(yesPrice + noPrice - 1) > 0.001) {
        // Prices don't match (allowing small floating point error)
        continue;
      }

      const oppositeRemaining = oppositeOrder.quantity - oppositeOrder.filled;
      const matchQuantity = Math.min(remainingQuantity, oppositeRemaining);
      const matchPrice = order.side === "YES" ? yesPrice : noPrice;

      // Create trade
      await prisma.trade.create({
        data: {
          buyOrderId: order.side === "YES" ? order.id : oppositeOrder.id,
          sellOrderId: order.side === "NO" ? order.id : oppositeOrder.id,
          outcomeId: order.outcomeId,
          buyerId: order.side === "YES" ? order.userId : oppositeOrder.userId,
          sellerId: order.side === "NO" ? order.userId : oppositeOrder.userId,
          quantity: matchQuantity,
          price: matchPrice
        }
      });

      // Update orders
      const newOrderFilled = order.filled + matchQuantity;
      const newOppositeOrderFilled = oppositeOrder.filled + matchQuantity;

      await prisma.order.update({
        where: { id: order.id },
        data: {
          filled: newOrderFilled,
          status: newOrderFilled >= order.quantity ? "FILLED" : "PARTIALLY_FILLED"
        }
      });

      await prisma.order.update({
        where: { id: oppositeOrder.id },
        data: {
          filled: newOppositeOrderFilled,
          status: newOppositeOrderFilled >= oppositeOrder.quantity ? "FILLED" : "PARTIALLY_FILLED"
        }
      });

      // Update positions
      await this.updatePosition(order.userId, order.outcomeId, order.side, matchQuantity, matchPrice);
      await this.updatePosition(oppositeOrder.userId, order.outcomeId, oppositeOrder.side, matchQuantity, matchPrice);

      remainingQuantity -= matchQuantity;

      // Update outcome probability based on trade
      await this.updateOutcomeProbability(order.outcomeId);
    }
  }

  /**
   * Update user's position after a trade
   */
  private static async updatePosition(
    userId: string,
    outcomeId: string,
    side: OrderSide,
    quantity: number,
    price: number
  ) {
    const existingPosition = await prisma.position.findUnique({
      where: {
        userId_outcomeId_side: {
          userId,
          outcomeId,
          side
        }
      }
    });

    if (existingPosition) {
      const totalQuantity = existingPosition.quantity + quantity;
      const newAvgPrice = (existingPosition.avgPrice * existingPosition.quantity + price * quantity) / totalQuantity;

      await prisma.position.update({
        where: { id: existingPosition.id },
        data: {
          quantity: totalQuantity,
          avgPrice: newAvgPrice
        }
      });
    } else {
      await prisma.position.create({
        data: {
          userId,
          outcomeId,
          side,
          quantity,
          avgPrice: price
        }
      });
    }
  }

  /**
   * Update outcome probability based on recent trades
   */
  private static async updateOutcomeProbability(outcomeId: string) {
    const recentTrades = await prisma.trade.findMany({
      where: { outcomeId },
      orderBy: { createdAt: "desc" },
      take: 10
    });

    if (recentTrades.length > 0) {
      const avgPrice = recentTrades.reduce((sum, trade) => sum + trade.price, 0) / recentTrades.length;

      await prisma.outcome.update({
        where: { id: outcomeId },
        data: { probability: avgPrice }
      });
    }
  }

  /**
   * Get order book for an outcome
   */
  static async getOrderBook(outcomeId: string) {
    const orders = await prisma.order.findMany({
      where: {
        outcomeId,
        status: { in: ["OPEN", "PARTIALLY_FILLED"] }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        price: "asc"
      }
    });

    const yesOrders = orders.filter(o => o.side === "YES");
    const noOrders = orders.filter(o => o.side === "NO");

    return {
      yes: yesOrders,
      no: noOrders
    };
  }

  /**
   * Cancel an order
   */
  static async cancelOrder(orderId: string, userId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      throw new Error("Order not found");
    }

    if (order.userId !== userId) {
      throw new Error("Unauthorized");
    }

    if (order.status === "FILLED") {
      throw new Error("Cannot cancel filled order");
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED" }
    });
  }
}
