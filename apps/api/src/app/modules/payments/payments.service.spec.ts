import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, getDataSourceToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { Payment } from './payment.entity';
import { OrdersService } from '../orders/orders.service';
import { ProductsService } from '../products/products.service';
import { AuditService } from '../audit/audit.service';

// Mock the Mollie client module (v4 uses createMollieClient named export)
jest.mock('@mollie/api-client', () => ({
  createMollieClient: jest.fn().mockReturnValue({
    payments: {
      create: jest.fn(),
      get: jest.fn(),
    },
  }),
  PaymentMethod: { ideal: 'ideal' },
  PaymentStatus: {},
}));

const mockOrder = {
  id: 'order-uuid-1',
  status: 'pending',
  totalAmount: 25.90,
  currency: 'EUR',
  items: [
    { productId: 'product-uuid-1', quantity: 2, unitPrice: 12.95 },
  ],
};

const mockPaymentRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
};

const mockDataSource = {
  createQueryRunner: jest.fn(() => ({
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {},
  })),
};

const mockConfig = {
  get: jest.fn((key: string) => {
    if (key === 'mollie') return { apiKey: 'test_xxxx', webhookSecret: 'secret' };
    if (key === 'app') return { baseUrl: 'http://localhost:3000', frontendUrl: 'http://localhost:4200' };
    return null;
  }),
};

const mockOrdersService = {
  findOne: jest.fn(),
  updateStatus: jest.fn(),
};

const mockProductsService = {
  restoreStock: jest.fn(),
};

const mockAuditService = {
  log: jest.fn().mockResolvedValue(undefined),
};

describe('PaymentsService', () => {
  let service: PaymentsService;
  let mollieClientMock: { payments: { create: jest.Mock; get: jest.Mock } };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: getRepositoryToken(Payment), useValue: mockPaymentRepo },
        { provide: getDataSourceToken(), useValue: mockDataSource },
        { provide: ConfigService, useValue: mockConfig },
        { provide: OrdersService, useValue: mockOrdersService },
        { provide: ProductsService, useValue: mockProductsService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);

    // Get a reference to the mocked Mollie client on the service
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mollieClientMock = (service as any).mollieClient;
  });

  describe('create()', () => {
    it('creates a Mollie payment with correct string amount format', async () => {
      mockOrdersService.findOne.mockResolvedValue(mockOrder);
      mockPaymentRepo.findOne.mockResolvedValue(null);
      mollieClientMock.payments.create.mockResolvedValue({
        id: 'tr_testxxx',
        status: 'open',
        _links: { checkout: { href: 'https://www.mollie.com/checkout/test-mode' } },
      });
      mockPaymentRepo.create.mockReturnValue({ id: 'payment-uuid-1', orderId: 'order-uuid-1', status: 'open', method: 'ideal', checkoutUrl: 'https://www.mollie.com/checkout/test-mode' });
      mockPaymentRepo.save.mockResolvedValue({});
      mockOrdersService.updateStatus.mockResolvedValue({});

      await service.create({ orderId: 'order-uuid-1' }, '127.0.0.1');

      // CRITICAL: verify Mollie receives amount as string with 2 decimal places
      expect(mollieClientMock.payments.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: { currency: 'EUR', value: '25.90' },
          method: 'ideal',
        }),
      );
    });

    it('returns existing checkout URL for idempotent duplicate request', async () => {
      mockOrdersService.findOne.mockResolvedValue(mockOrder);
      mockPaymentRepo.findOne.mockResolvedValue({
        id: 'payment-uuid-1',
        orderId: 'order-uuid-1',
        status: 'open',
        method: 'ideal',
        checkoutUrl: 'https://existing-checkout-url.mollie.com',
      });

      const result = await service.create({ orderId: 'order-uuid-1' }, '127.0.0.1');

      // Must not call Mollie again
      expect(mollieClientMock.payments.create).not.toHaveBeenCalled();
      expect(result.checkoutUrl).toBe('https://existing-checkout-url.mollie.com');
    });

    it('throws BadRequestException for order not in pending status', async () => {
      mockOrdersService.findOne.mockResolvedValue({ ...mockOrder, status: 'paid' });
      mockPaymentRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create({ orderId: 'order-uuid-1' }, '127.0.0.1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('handleWebhook()', () => {
    it('marks order as paid when Mollie reports paid status', async () => {
      mollieClientMock.payments.get.mockResolvedValue({ id: 'tr_xxx', status: 'paid' });
      mockPaymentRepo.findOne.mockResolvedValue({
        id: 'payment-uuid-1',
        orderId: 'order-uuid-1',
        status: 'open',
        molliePaymentId: 'tr_xxx',
        order: mockOrder,
      });
      mockPaymentRepo.update.mockResolvedValue(undefined);
      mockOrdersService.updateStatus.mockResolvedValue(undefined);
      mockOrdersService.findOne.mockResolvedValue({ ...mockOrder, items: [] });

      await service.handleWebhook('tr_xxx', '1.2.3.4');

      expect(mollieClientMock.payments.get).toHaveBeenCalledWith('tr_xxx');
      expect(mockPaymentRepo.update).toHaveBeenCalledWith('payment-uuid-1', { status: 'paid' });
      expect(mockOrdersService.updateStatus).toHaveBeenCalledWith('order-uuid-1', 'paid', 'webhook', '1.2.3.4');
    });

    it('marks order as failed and restores stock when payment expires', async () => {
      const orderWithItems = {
        ...mockOrder,
        items: [{ productId: 'product-uuid-1', quantity: 2 }],
      };
      mollieClientMock.payments.get.mockResolvedValue({ id: 'tr_xxx', status: 'expired' });
      mockPaymentRepo.findOne.mockResolvedValue({
        id: 'payment-uuid-1',
        orderId: 'order-uuid-1',
        status: 'open',
        molliePaymentId: 'tr_xxx',
        order: orderWithItems,
      });
      mockPaymentRepo.update.mockResolvedValue(undefined);
      mockOrdersService.updateStatus.mockResolvedValue(undefined);
      mockOrdersService.findOne.mockResolvedValue(orderWithItems);
      mockProductsService.restoreStock.mockResolvedValue(undefined);

      await service.handleWebhook('tr_xxx', '1.2.3.4');

      expect(mockOrdersService.updateStatus).toHaveBeenCalledWith('order-uuid-1', 'failed', 'webhook', '1.2.3.4');
    });

    it('skips processing when payment is already in terminal state', async () => {
      mockPaymentRepo.findOne.mockResolvedValue({
        id: 'payment-uuid-1',
        orderId: 'order-uuid-1',
        status: 'paid', // already terminal
        molliePaymentId: 'tr_xxx',
        order: mockOrder,
      });

      await service.handleWebhook('tr_xxx', '1.2.3.4');

      expect(mollieClientMock.payments.get).not.toHaveBeenCalled();
      expect(mockPaymentRepo.update).not.toHaveBeenCalled();
    });
  });
});
