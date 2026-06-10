import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { AppConfig } from '../../config/configuration';
import { Order } from '../orders/order.entity';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly to: string;
  private readonly from: string;

  constructor(private readonly config: ConfigService<AppConfig>) {
    const mail = config.get('mail', { infer: true })!;
    this.to = mail.to;
    this.from = mail.from;

    this.transporter = nodemailer.createTransport({
      host: mail.host,
      port: mail.port,
      secure: mail.port === 465,
      auth: mail.user ? { user: mail.user, pass: mail.pass } : undefined,
    });
  }

  async sendOrderNotification(order: Order): Promise<void> {
    if (!this.config.get('mail', { infer: true })!.user) {
      this.logger.warn('MAIL_USER niet ingesteld — e-mail overgeslagen');
      return;
    }

    const itemRows = order.items
      .map(
        (i) =>
          `<tr>
            <td style="padding:6px 12px;border-bottom:1px solid #eee">${i.productName}</td>
            <td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:center">${i.quantity}×</td>
            <td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right">€${Number(i.unitPrice).toFixed(2)}</td>
            <td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right">€${Number(i.totalPrice).toFixed(2)}</td>
          </tr>`,
      )
      .join('');

    const date = new Date(order.createdAt).toLocaleString('nl-NL', {
      timeZone: 'Europe/Amsterdam',
      dateStyle: 'long',
      timeStyle: 'short',
    });

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333">
        <div style="background:#c0392b;padding:20px 24px;border-radius:8px 8px 0 0">
          <h1 style="margin:0;color:#fff;font-size:20px">Nieuwe bestelling ontvangen</h1>
        </div>
        <div style="padding:24px;background:#fff;border:1px solid #eee;border-top:none;border-radius:0 0 8px 8px">
          <p style="margin:0 0 16px">
            <strong>Bestelnummer:</strong> #${order.orderNumber ?? order.id.slice(0, 8)}<br>
            <strong>Datum:</strong> ${date}<br>
            <strong>Status:</strong> ${order.status}
          </p>

          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <thead>
              <tr style="background:#f5f5f5">
                <th style="padding:8px 12px;text-align:left">Product</th>
                <th style="padding:8px 12px;text-align:center">Aantal</th>
                <th style="padding:8px 12px;text-align:right">Prijs</th>
                <th style="padding:8px 12px;text-align:right">Totaal</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="padding:10px 12px;font-weight:bold;text-align:right">Totaal</td>
                <td style="padding:10px 12px;font-weight:bold;text-align:right;color:#c0392b">
                  €${Number(order.totalAmount).toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>

          ${order.customerEmail ? `<p style="margin-top:16px"><strong>Klant:</strong> ${order.customerEmail}</p>` : ''}
        </div>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: this.from,
        to: this.to,
        subject: `Nieuwe bestelling #${order.orderNumber ?? order.id.slice(0, 8)} — €${Number(order.totalAmount).toFixed(2)}`,
        html,
      });
      this.logger.log(`Bestelling e-mail verstuurd naar ${this.to} voor order #${order.orderNumber}`);
    } catch (err) {
      this.logger.error(`E-mail versturen mislukt: ${String(err)}`);
    }
  }
}
