import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, getDataSourceToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { Order } from './order.entity';
import { AuditService } from '../audit/audit.service';
import { ProductsService } from '../products/products.service';

const mockOrder: Order = {
  id: 'order-uuid-1',
  customerEmail: 'test@example.nl',
  customerFirstName: 'Jan',
  customerLastName: 'de Vries',
  customerPhone: null,
  shippingAddress: 'Keizersgracht 1',
  shippingPostalCode: '1015 CW',
  shippingCity: 'Amsterdam',
  shippingCountry: 'NL',
  status: 'pending',
  totalAmount: 25.90,
  currency: 'EUR',
  notes: null,
  items: [
    {
      id: 'item-uuid-1',
      orderId: 'order-uuid-1',
      productId: 'product-uuid-1',
      productName: 'Stroopwafel Luxe Blik',
      unitPrice: 12.95,
      quantity: 2,
      totalPrice: 25.90,
      order: null as unknown as Order,
    },
  ],
  payment: null,
  createdAt: new Date('2026-04-14T10:00:00Z'),
  updatedAt: new Date('2026-04-14T10:00:00Z'),
};

const mockQueryRunner = {
  connect: jest.fn(),
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  rollbackTransaction: jest.fn(),
  release: jest.fn(),
  manager: {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  },
};

const mockDataSource = {
  createQueryRunner: jest.fn(() => mockQueryRunner),
};

const mockOrderRepo = {
  findOne: jest.fn(),
  find: jest.fn(),
  update: jest.fn(),
};

const mockProductsService = {
  decrementStock: jest.fn(),
};

const mockAuditService = {
  log: jest.fn().mockResolvedValue(undefined),
};

describe('OrdersService', () => {
  let service: OrdersService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getRepositoryToken(Order), useValue: mockOrderRepo },
        { provide: getDataSourceToken(), useValue: mockDataSource },
        { provide: ProductsService, useValue: mockProductsService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  describe('create()', () => {
    it('creates an order and decrements stock within a transaction', async () => {
      const product = { id: 'product-uuid-1', name: 'Stroopwafel Luxe Blik', price: 12.95, stock: 10, isActive: true };
      mockQueryRunner.manager.findOne.mockResolvedValue(product);
      mockProductsService.decrementStock.mockResolvedValue(undefined);
      mockQueryRunner.manager.create.mockReturnValue({ id: 'order-uuid-1' });
      mockQueryRunner.manager.save
        .mockResolvedValueOnce({ id: 'order-uuid-1', status: 'pending' })
        .mockResolvedValueOnce([]);
      mockOrderRepo.findOne.mockResolvedValue(mockOrder);

      const dto = {
        customerEmail: 'test@example.nl',
        customerFirstName: 'Jan',
        customerLastName: 'de Vries',
        shippingAddress: 'Keizersgracht 1',
        shippingPostalCode: '1015 CW',
        shippingCity: 'Amsterdam',
        items: [{ productId: 'product-uuid-1', quantity: 2 }],
      };

      const result = await service.create(dto, '127.0.0.1');

      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.manager.findOne).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ where: expect.objectContaining({ id: 'product-uuid-1' }) }),
      );
      expect(mockProductsService.decrementStock).toHaveBeenCalledWith(
        'product-uuid-1',
        2,
        mockQueryRunner.manager,
      );
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(result.id).toBe('order-uuid-1');
    });

    it('rolls back transaction when stock is insufficient', async () => {
      const product = { id: 'product-uuid-1', name: 'Test', price: 10, stock: 0, isActive: true };
      mockQueryRunner.manager.findOne.mockResolvedValue(product);
      mockProductsService.decrementStock.mockRejectedValue(
        new ConflictException('Insufficient stock'),
      );

      const dto = {
        customerEmail: 'test@example.nl',
        customerFirstName: 'Jan',
        customerLastName: 'de Vries',
        shippingAddress: 'Keizersgracht 1',
        shippingPostalCode: '1015 CW',
        shippingCity: 'Amsterdam',
        items: [{ productId: 'product-uuid-1', quantity: 5 }],
      };

      await expect(service.create(dto, '127.0.0.1')).rejects.toThrow(ConflictException);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when product does not exist', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValue(null);

      const dto = {
        customerEmail: 'test@example.nl',
        customerFirstName: 'Jan',
        customerLastName: 'de Vries',
        shippingAddress: 'Keizersgracht 1',
        shippingPostalCode: '1015 CW',
        shippingCity: 'Amsterdam',
        items: [{ productId: 'nonexistent-uuid', quantity: 1 }],
      };

      await expect(service.create(dto, '127.0.0.1')).rejects.toThrow(NotFoundException);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe('updateStatus()', () => {
    it('allows valid transition pending → payment_pending', async () => {
      mockOrderRepo.findOne.mockResolvedValue({ ...mockOrder, status: 'pending' });
      mockOrderRepo.update.mockResolvedValue(undefined);

      const result = await service.updateStatus('order-uuid-1', 'payment_pending', 'system', null);
      expect(mockOrderRepo.update).toHaveBeenCalledWith('order-uuid-1', { status: 'payment_pending' });
    });

    it('rejects invalid transition paid → pending', async () => {
      mockOrderRepo.findOne.mockResolvedValue({ ...mockOrder, status: 'paid' });

      await expect(
        service.updateStatus('order-uuid-1', 'pending', 'system', null),
      ).rejects.toThrow(/Cannot transition/);
    });

    it('throws NotFoundException for unknown order', async () => {
      mockOrderRepo.findOne.mockResolvedValue(null);
      await expect(
        service.updateStatus('nonexistent', 'paid', 'system', null),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne()', () => {
    it('returns order when found', async () => {
      mockOrderRepo.findOne.mockResolvedValue(mockOrder);
      const result = await service.findOne('order-uuid-1');
      expect(result.id).toBe('order-uuid-1');
    });

    it('throws NotFoundException when not found', async () => {
      mockOrderRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
