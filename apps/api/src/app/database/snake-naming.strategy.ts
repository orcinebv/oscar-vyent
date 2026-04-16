import { DefaultNamingStrategy } from 'typeorm';

const toSnakeCase = (str: string): string =>
  str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

/**
 * Maps TypeORM entity property names (camelCase) to PostgreSQL column names (snake_case).
 * Required because our migrations use snake_case DDL while TypeScript properties are camelCase.
 *
 * Examples:
 *   imageUrl    → image_url
 *   isActive    → is_active
 *   createdAt   → created_at
 *   molliePaymentId → mollie_payment_id
 */
export class SnakeNamingStrategy extends DefaultNamingStrategy {
  override columnName(
    propertyName: string,
    customName: string,
    embeddedPrefixes: string[],
  ): string {
    return toSnakeCase(
      embeddedPrefixes.concat(customName || propertyName).join('_'),
    );
  }

  override relationName(propertyName: string): string {
    return toSnakeCase(propertyName);
  }

  override joinColumnName(relationName: string, referencedColumnName: string): string {
    return toSnakeCase(`${relationName}_${referencedColumnName}`);
  }

  override joinTableName(
    firstTableName: string,
    secondTableName: string,
  ): string {
    return toSnakeCase(`${firstTableName}_${secondTableName}`);
  }
}
