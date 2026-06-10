import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';
import { SettingsService } from '../settings/settings.service';
import * as nodemailer from 'nodemailer';
import { Order } from '../orders/order.entity';

jest.mock('nodemailer');

const mockSendMail = jest.fn();
const mockTransporter = { sendMail: mockSendMail };

const makeConfig = (mailUser = 'sender@example.nl') => ({
  get: jest.fn((key: string) => {
    if (key === 'mail') {
      return {
        host: 'smtp.example.com',
        port: 587,
        user: mailUser,
        pass: 'testpass',
        from: 'noreply@example.com',
        to: 'default@example.nl',
      };
    }
    return null;
  }),
});

const mockSettingsService = {
  get: jest.fn(),
};

const mockOrder: Partial<Order> = {
  id: 'order-uuid-1',
  orderNumber: 1001,
  status: 'pending',
  totalAmount: 25.90,
  customerEmail: 'customer@example.nl',
  createdAt: new Date('2026-01-01T10:00:00Z'),
  items: [
    {
      id: 'item-uuid-1',
      orderId: 'order-uuid-1',
      itemType: 'product' as const,
      productId: 'product-uuid-1',
      comboId: null,
      productName: 'Stroopwafel',
      unitPrice: 12.95,
      quantity: 2,
      totalPrice: 25.90,
      selectedExtras: null,
      order: null as unknown as Order,
    },
  ],
};

describe('MailService', () => {
  let service: MailService;

  beforeEach(async () => {
    jest.clearAllMocks();
    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        { provide: ConfigService, useValue: makeConfig() },
        { provide: SettingsService, useValue: mockSettingsService },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  describe('sendOrderNotification()', () => {
    it('sends email to recipient stored in database', async () => {
      mockSettingsService.get.mockResolvedValue('admin@company.nl');
      mockSendMail.mockResolvedValue({});

      await service.sendOrderNotification(mockOrder as Order);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'admin@company.nl' }),
      );
    });

    it('falls back to config default when no DB recipient is set', async () => {
      mockSettingsService.get.mockResolvedValue(null);
      mockSendMail.mockResolvedValue({});

      await service.sendOrderNotification(mockOrder as Order);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'default@example.nl' }),
      );
    });

    it('skips sending when MAIL_USER is not configured', async () => {
      (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          MailService,
          { provide: ConfigService, useValue: makeConfig('') },
          { provide: SettingsService, useValue: mockSettingsService },
        ],
      }).compile();

      const unconfiguredService = module.get<MailService>(MailService);
      await unconfiguredService.sendOrderNotification(mockOrder as Order);

      expect(mockSendMail).not.toHaveBeenCalled();
    });

    it('does not throw when the SMTP transport fails', async () => {
      mockSettingsService.get.mockResolvedValue(null);
      mockSendMail.mockRejectedValue(new Error('SMTP connection refused'));

      await expect(
        service.sendOrderNotification(mockOrder as Order),
      ).resolves.not.toThrow();
    });

    it('includes order number and total amount in the email subject', async () => {
      mockSettingsService.get.mockResolvedValue(null);
      mockSendMail.mockResolvedValue({});

      await service.sendOrderNotification(mockOrder as Order);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringMatching(/#1001/),
        }),
      );
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('€25.90'),
        }),
      );
    });

    it('uses the from address from config', async () => {
      mockSettingsService.get.mockResolvedValue(null);
      mockSendMail.mockResolvedValue({});

      await service.sendOrderNotification(mockOrder as Order);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({ from: 'noreply@example.com' }),
      );
    });
  });
});
