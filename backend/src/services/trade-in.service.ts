import type { ProductCondition, TradePayoutMethod } from '@prisma/client';
import { prisma } from '../config/prisma';
import { NotFoundError, ValidationError } from '../exceptions/AppError';
import { createNotification } from './notification.service';

function generateRequestNumber(): string {
  const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = String(Math.floor(1000 + Math.random() * 9000));
  return `TR-${ymd}-${suffix}`;
}

export async function getConsolesTree() {
  return prisma.tradeConsole.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    include: {
      devices: {
        where: { isActive: true },
        orderBy: { name: 'asc' },
        include: {
          models: {
            where: { isActive: true },
            orderBy: { name: 'asc' },
            include: {
              options: {
                where: { isActive: true },
                orderBy: { storage: 'asc' },
                include: {
                  accessories: true,
                },
              },
            },
          },
        },
      },
    },
  });
}

async function loadOption(modelOptionId: string) {
  const option = await prisma.tradeModelOption.findFirst({
    where: { id: modelOptionId, isActive: true },
    include: { accessories: true },
  });
  if (!option) throw new NotFoundError('Trade option not found');
  return option;
}

export async function quoteTradeIn(modelOptionId: string, accessoryIds?: string[]) {
  const option = await loadOption(modelOptionId);

  let cashPence = option.baseCashPence;
  let creditPence = option.baseCreditPence;

  if (accessoryIds?.length) {
    const selected = option.accessories.filter((a) => accessoryIds.includes(a.id));
    for (const acc of selected) {
      cashPence += acc.cashDelta;
      creditPence += acc.creditDelta;
    }

    const required = option.accessories.filter((a) => a.isRequired);
    for (const req of required) {
      if (!accessoryIds.includes(req.id)) {
        throw new ValidationError(`Required accessory missing: ${req.name}`);
      }
    }
  } else {
    const missingRequired = option.accessories.filter((a) => a.isRequired);
    if (missingRequired.length > 0) {
      throw new ValidationError(
        `Required accessories: ${missingRequired.map((a) => a.name).join(', ')}`,
      );
    }
  }

  return { cashPence, creditPence, modelOptionId: option.id };
}

export async function createTradeRequest(
  userId: string,
  input: {
    modelOptionId?: string;
    payoutMethod: TradePayoutMethod;
    accessories?: string[];
    customerNotes?: string;
    isManual?: boolean;
    manualCategory?: string;
    manualDescription?: string;
    bankAccountName?: string;
    bankSortCode?: string;
    bankAccountNumber?: string;
  },
) {
  const isManual = Boolean(input.isManual);

  let quotedCash = 0;
  let quotedCredit = 0;
  let optionId: string | null = null;

  if (isManual) {
    if (!input.manualCategory?.trim() || !input.manualDescription?.trim()) {
      throw new ValidationError('Manual trade-in requires category and description');
    }
  } else {
    if (!input.modelOptionId) throw new ValidationError('modelOptionId is required');
    const quote = await quoteTradeIn(input.modelOptionId, input.accessories);
    quotedCash = quote.cashPence;
    quotedCredit = quote.creditPence;
    optionId = input.modelOptionId;
  }

  if (input.payoutMethod === 'CASH') {
    if (
      !input.bankAccountName?.trim() ||
      !input.bankSortCode?.trim() ||
      !input.bankAccountNumber?.trim()
    ) {
      throw new ValidationError('Bank details are required for cash payouts');
    }
  }

  const request = await prisma.tradeRequest.create({
    data: {
      requestNumber: generateRequestNumber(),
      userId,
      optionId,
      payoutMethod: input.payoutMethod,
      quotedCash,
      quotedCredit,
      selectedAccessories: input.accessories ?? [],
      customerNotes: input.customerNotes,
      status: 'SUBMITTED',
      isManual,
      manualCategory: isManual ? input.manualCategory : null,
      manualDescription: isManual ? input.manualDescription : null,
      bankAccountName: input.payoutMethod === 'CASH' ? input.bankAccountName : null,
      bankSortCode: input.payoutMethod === 'CASH' ? input.bankSortCode : null,
      bankAccountNumber: input.payoutMethod === 'CASH' ? input.bankAccountNumber : null,
    },
    include: {
      option: {
        include: {
          model: { include: { device: { include: { console: true } } } },
        },
      },
    },
  });

  await createNotification(
    userId,
    'TRADE',
    'Trade-in submitted',
    `Your trade-in request ${request.requestNumber} has been submitted.`,
    `/trade-in/requests/${request.id}`,
  );

  return request;
}

export async function listUserTradeRequests(userId: string) {
  return prisma.tradeRequest.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      option: {
        include: {
          model: { include: { device: { include: { console: true } } } },
        },
      },
    },
  });
}

export async function getUserTradeRequest(userId: string, id: string) {
  const request = await prisma.tradeRequest.findFirst({
    where: { id, userId },
    include: {
      option: {
        include: {
          model: { include: { device: { include: { console: true } } } },
          accessories: true,
        },
      },
    },
  });
  if (!request) throw new NotFoundError('Trade request not found');
  return request;
}

export async function adminListTradeRequests() {
  return prisma.tradeRequest.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true } },
      option: {
        include: {
          model: { include: { device: { include: { console: true } } } },
        },
      },
    },
  });
}

export async function adminUpdateTradeRequest(
  id: string,
  input: {
    status?: string;
    finalCashPence?: number;
    finalCreditPence?: number;
    finalAmount?: number;
    adminNotes?: string;
    gradedCondition?: ProductCondition;
  },
) {
  const existing = await prisma.tradeRequest.findUnique({
    where: { id },
    include: { user: true },
  });
  if (!existing) throw new NotFoundError('Trade request not found');

  const wasPaid = existing.status === 'PAID';
  const newStatus = input.status ?? existing.status;

  let finalAmount = existing.finalAmount;
  if (input.finalAmount != null) finalAmount = input.finalAmount;
  if (input.finalCashPence != null) finalAmount = input.finalCashPence;
  if (input.finalCreditPence != null) finalAmount = input.finalCreditPence;

  // Auto-fill from quote when marking PAID so store credit / cash payout can complete
  if (newStatus === 'PAID' && (finalAmount == null || finalAmount <= 0)) {
    finalAmount = existing.payoutMethod === 'CASH' ? existing.quotedCash : existing.quotedCredit;
  }

  const request = await prisma.$transaction(async (tx) => {
    const updated = await tx.tradeRequest.update({
      where: { id },
      data: {
        ...(input.status ? { status: input.status as typeof existing.status } : {}),
        ...(input.adminNotes !== undefined ? { adminNotes: input.adminNotes } : {}),
        ...(input.gradedCondition ? { gradedCondition: input.gradedCondition } : {}),
        ...(finalAmount != null ? { finalAmount } : {}),
        ...(newStatus === 'PAID' && !existing.paidAt ? { paidAt: new Date() } : {}),
        ...(newStatus === 'RECEIVED' && !existing.receivedAt ? { receivedAt: new Date() } : {}),
        ...(newStatus === 'GRADED' && !existing.gradedAt ? { gradedAt: new Date() } : {}),
      },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        option: {
          include: {
            model: { include: { device: { include: { console: true } } } },
          },
        },
      },
    });

    if (
      !wasPaid &&
      newStatus === 'PAID' &&
      existing.payoutMethod === 'STORE_CREDIT' &&
      finalAmount != null &&
      finalAmount > 0
    ) {
      const newBalance = existing.user.storeCredit + finalAmount;
      await tx.user.update({
        where: { id: existing.userId },
        data: { storeCredit: newBalance },
      });
      await tx.storeCreditLedger.create({
        data: {
          userId: existing.userId,
          delta: finalAmount,
          balanceAfter: newBalance,
          reason: 'Trade-in payout',
          referenceId: existing.id,
        },
      });
    }

    return updated;
  });

  if (!wasPaid && newStatus === 'PAID') {
    await createNotification(
      existing.userId,
      'TRADE',
      'Trade-in paid',
      `Your trade-in ${existing.requestNumber} has been marked as paid.`,
      `/account`,
    );
  }

  return request;
}

export async function adminDeleteTradeRequest(id: string) {
  const existing = await prisma.tradeRequest.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Trade request not found');
  await prisma.tradeRequest.delete({ where: { id } });
  return { deleted: true, id };
}
