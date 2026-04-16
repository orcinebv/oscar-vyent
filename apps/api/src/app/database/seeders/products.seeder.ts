import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../modules/products/product.entity';

// Demo products for development & staging only.
// NOT executed in production (guarded below).
const SEED_PRODUCTS: Partial<Product>[] = [
  {
    name: 'Stroopwafel Luxe Blik',
    description:
      'Authentieke Hollandse stroopwafels in een luxe bewaarblik. Handgemaakt met vers karamel. Per blik 24 stuks.',
    price: 12.95,
    stock: 150,
    imageUrl: '/assets/products/stroopwafel.jpg',
    category: 'Levensmiddelen',
    isActive: true,
  },
  {
    name: 'Delftsblauw Vaasje',
    description:
      'Handgeschilderd Delfts blauw vaasje, 18cm hoog. Authentiek handwerk uit Delft. Ideaal als cadeau of decoratie.',
    price: 34.5,
    stock: 45,
    imageUrl: '/assets/products/delfts-blauw.jpg',
    category: 'Wonen & Decoratie',
    isActive: true,
  },
  {
    name: 'Nederlandse Tulpenbollen (10 stuks)',
    description:
      'Geselecteerde tulpenbollen van Nederlandse kwekers. Bloeitijd voorjaar. Kleuren: rood, geel en roze gemengd.',
    price: 8.75,
    stock: 300,
    imageUrl: '/assets/products/tulpen.jpg',
    category: 'Tuin',
    isActive: true,
  },
  {
    name: 'Gouda Kaas Oudbeleegd (500g)',
    description:
      'Authentieke boerenkaas uit Gouda, minimaal 18 maanden gerijpt. Karakteristieke kruimelige textuur en rijke smaak.',
    price: 11.25,
    stock: 80,
    imageUrl: '/assets/products/gouda-kaas.jpg',
    category: 'Levensmiddelen',
    isActive: true,
  },
  {
    name: 'Klompen Souvenirpaar (maat 38)',
    description:
      'Traditionele Nederlandse klompen, met de hand beschilderd met windmolen en tulpenmotief. Decoratief en authentiek.',
    price: 19.95,
    stock: 60,
    imageUrl: '/assets/products/klompen.jpg',
    category: 'Souvenirs',
    isActive: true,
  },
  {
    name: 'Hagelslag Melkchocolade (400g)',
    description:
      'De Ruijter melkchocolade hagelslag in familiepak. Klassiek Hollands ontbijtgenot. 400 gram per pak.',
    price: 3.49,
    stock: 500,
    imageUrl: '/assets/products/hagelslag.jpg',
    category: 'Levensmiddelen',
    isActive: true,
  },
  {
    name: 'Windmolen Miniatuur (hout)',
    description:
      'Houten miniatuur windmolen, 25cm hoog. Handgemaakt en geschilderd. Inclusief draaiende wieken. Perfect als cadeau.',
    price: 24.99,
    stock: 35,
    imageUrl: '/assets/products/windmolen.jpg',
    category: 'Wonen & Decoratie',
    isActive: true,
  },
  {
    name: 'AdvocaatЛикeur (500ml)',
    description:
      'Traditionele Nederlandse advocaat, gemaakt van verse eieren en Nederlandse brandewijn. 17% alcohol. 500ml fles.',
    price: 9.95,
    stock: 0, // Out of stock — tests the stock-display logic on the frontend
    imageUrl: '/assets/products/advocaat.jpg',
    category: 'Dranken',
    isActive: true,
  },
];

@Injectable()
export class ProductsSeeder {
  private readonly logger = new Logger(ProductsSeeder.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async seed(): Promise<void> {
    if (process.env['NODE_ENV'] === 'production') {
      this.logger.warn('Seeder skipped in production environment');
      return;
    }

    const existing = await this.productRepo.count();
    if (existing > 0) {
      this.logger.log(`Seeder skipped — ${existing} products already exist`);
      return;
    }

    const products = SEED_PRODUCTS.map((p) => this.productRepo.create(p));
    await this.productRepo.save(products);

    this.logger.log(`Seeded ${products.length} demo products`);
  }
}
