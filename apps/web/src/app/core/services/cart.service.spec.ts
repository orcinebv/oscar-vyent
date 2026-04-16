import { TestBed } from '@angular/core/testing';
import { CartService } from './cart.service';
import { ProductDto } from '@oscar-vyent/contracts';

const mockProduct = (overrides: Partial<ProductDto> = {}): ProductDto => ({
  id: 'product-uuid-1',
  name: 'Stroopwafel',
  description: 'Test',
  price: 12.95,
  stock: 50,
  imageUrl: null,
  isActive: true,
  category: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

describe('CartService', () => {
  let service: CartService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(CartService);
  });

  afterEach(() => localStorage.clear());

  describe('initial state', () => {
    it('starts with an empty cart', () => {
      expect(service.items()).toEqual([]);
      expect(service.count()).toBe(0);
      expect(service.total()).toBe(0);
      expect(service.isEmpty()).toBe(true);
    });
  });

  describe('addItem()', () => {
    it('adds a new product to the cart', () => {
      const p = mockProduct();
      service.addItem(p, 1);
      expect(service.items()).toHaveLength(1);
      expect(service.items()[0].product.id).toBe(p.id);
      expect(service.items()[0].quantity).toBe(1);
    });

    it('increments quantity when adding an existing product', () => {
      const p = mockProduct();
      service.addItem(p, 2);
      service.addItem(p, 3);
      expect(service.items()).toHaveLength(1);
      expect(service.items()[0].quantity).toBe(5);
    });

    it('adds multiple different products', () => {
      service.addItem(mockProduct({ id: '1' }));
      service.addItem(mockProduct({ id: '2' }));
      expect(service.items()).toHaveLength(2);
    });
  });

  describe('removeItem()', () => {
    it('removes a product from the cart', () => {
      const p = mockProduct();
      service.addItem(p);
      service.removeItem(p.id);
      expect(service.items()).toHaveLength(0);
    });

    it('is a no-op for a product not in the cart', () => {
      service.removeItem('nonexistent-id');
      expect(service.items()).toHaveLength(0);
    });
  });

  describe('updateQuantity()', () => {
    it('updates the quantity of an existing item', () => {
      const p = mockProduct();
      service.addItem(p, 1);
      service.updateQuantity(p.id, 5);
      expect(service.items()[0].quantity).toBe(5);
    });

    it('removes the item when quantity is set to 0', () => {
      const p = mockProduct();
      service.addItem(p, 2);
      service.updateQuantity(p.id, 0);
      expect(service.items()).toHaveLength(0);
    });

    it('removes the item when quantity is negative', () => {
      const p = mockProduct();
      service.addItem(p);
      service.updateQuantity(p.id, -1);
      expect(service.items()).toHaveLength(0);
    });
  });

  describe('computed values', () => {
    it('count() returns sum of all quantities', () => {
      service.addItem(mockProduct({ id: '1' }), 3);
      service.addItem(mockProduct({ id: '2' }), 2);
      expect(service.count()).toBe(5);
    });

    it('total() returns correct total (price × quantity sum)', () => {
      service.addItem(mockProduct({ id: '1', price: 10.00 }), 2); // 20.00
      service.addItem(mockProduct({ id: '2', price: 5.50 }),  1); // 5.50
      expect(service.total()).toBeCloseTo(25.50, 2);
    });

    it('isEmpty() is true when cart is empty', () => {
      expect(service.isEmpty()).toBe(true);
    });

    it('isEmpty() is false when cart has items', () => {
      service.addItem(mockProduct());
      expect(service.isEmpty()).toBe(false);
    });
  });

  describe('clear()', () => {
    it('empties the cart', () => {
      service.addItem(mockProduct());
      service.clear();
      expect(service.items()).toHaveLength(0);
      expect(service.isEmpty()).toBe(true);
    });
  });

  describe('localStorage persistence', () => {
    it('persists cart to localStorage after addItem', () => {
      service.addItem(mockProduct(), 2);
      const stored = JSON.parse(localStorage.getItem('oscar_vyent_cart')!);
      expect(stored).toHaveLength(1);
      expect(stored[0].quantity).toBe(2);
    });

    it('loads existing cart from localStorage on construction', () => {
      const p = mockProduct();
      localStorage.setItem('oscar_vyent_cart', JSON.stringify([{ product: p, quantity: 3 }]));

      // Create a fresh service instance
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const freshService = TestBed.inject(CartService);

      expect(freshService.items()).toHaveLength(1);
      expect(freshService.items()[0].quantity).toBe(3);
    });

    it('handles corrupt localStorage gracefully', () => {
      localStorage.setItem('oscar_vyent_cart', 'not-valid-json{{');
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const freshService = TestBed.inject(CartService);
      expect(freshService.items()).toEqual([]);
    });
  });
});
