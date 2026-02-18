import { Resend } from 'resend';
import { supabase } from '@/lib/supabase/client';
import { getDB } from '@/lib/indexeddb/client';
import { addToSyncQueue } from '@/lib/sync/sync-service';
import type { Database } from '@/types/supabase';

type Notification = Database['public']['Tables']['notifications']['Row'];
type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];
type NotificationUpdate = Database['public']['Tables']['notifications']['Update'];

interface WhatsAppTemplateData {
  studentName: string;
  admissionNumber: string;
  amount: number;
  schoolName: string;
  receiptUrl?: string;
}

interface IndexedDBNotification {
  id: string;
  type: 'sms' | 'email' | 'whatsapp';
  message: string;
  recipient_email?: string | null;
  recipient_phone?: string | null;
  status: 'pending' | 'sent' | 'failed';
  error_message?: string;
  school_id: string;
  sent_at?: string | null;
  created_at: string;
  updated_at: string;
  sync_status: 'pending' | 'synced';
}

export class NotificationService {
  private static instance: NotificationService;
  private resend: Resend | null = null;
  private readonly MAX_RETRIES = 3;
  private readonly SMS_LENGTH_LIMIT = 160;
  private schoolId: string | null = null;

  private constructor() {
    // Don't initialize services in constructor
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  public setSchoolId(schoolId: string) {
    this.schoolId = schoolId;
  }

  private getResendClient(): Resend {
    if (!this.resend) {
      if (!process.env.RESEND_API_KEY) {
        throw new Error('Resend API key is not configured');
      }
      this.resend = new Resend(process.env.RESEND_API_KEY);
    }
    return this.resend;
  }

  private isValidPhoneNumber(phoneNumber: string): boolean {
    // Remove any spaces or special characters
    const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // Check if it's a valid Kenyan number
    // Format: 07XXXXXXXX or +254XXXXXXXXX
    return /^(?:\+254|0)[17]\d{8}$/.test(cleaned);
  }

  private formatPhoneNumber(phoneNumber: string): string {
    // Remove any spaces or special characters
    const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // If it starts with 0, replace with +254
    if (cleaned.startsWith('0')) {
      return `+254${cleaned.slice(1)}`;
    }
    
    // If it starts with +254, return as is
    if (cleaned.startsWith('+254')) {
      return cleaned;
    }
    
    // If it doesn't have country code, add +254
    return `+254${cleaned}`;
  }

  private async createNotificationRecord(
    type: 'sms' | 'email' | 'whatsapp',
    recipient: string,
    message: string
  ): Promise<string> {
    if (!this.schoolId) {
      throw new Error('School ID not set. Call setSchoolId() before creating notifications.');
    }

    const record: NotificationInsert = {
      type,
      message,
      status: 'pending',
      school_id: this.schoolId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Set recipient based on type
    if (type === 'email') {
      record.recipient_email = recipient;
    } else {
      record.recipient_phone = recipient;
    }

    // Always store in Supabase (online-only)
    const { data, error } = await supabase
      .from('notifications')
      .insert(record)
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  }

  private async updateNotificationStatus(
    id: string,
    status: Notification['status'],
    error?: string
  ): Promise<void> {
    const update: NotificationUpdate = {
      status,
      updated_at: new Date().toISOString()
    };

    if (error) {
      update.error_message = error;
    }

    // Always update in Supabase (online-only)
    const { error: updateError } = await supabase
      .from('notifications')
      .update(update)
      .eq('id', id);

    if (updateError) throw updateError;
  }

  public async sendSMS(phoneNumber: string, message: string): Promise<boolean> {
    if (!this.isValidPhoneNumber(phoneNumber)) {
      throw new Error(`Invalid phone number format: ${phoneNumber}`);
    }

    if (message.length > this.SMS_LENGTH_LIMIT) {
      throw new Error(`Message exceeds ${this.SMS_LENGTH_LIMIT} characters limit`);
    }

    // Create notification record
    const notificationId = await this.createNotificationRecord('sms', phoneNumber, message);

    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const formattedPhone = this.formatPhoneNumber(phoneNumber);
        console.log(`Original phone: ${phoneNumber}, Formatted phone: ${formattedPhone}`);
        
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const response = await fetch(`${baseUrl}/api/notifications/sms`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phoneNumber: formattedPhone,
            message
          })
        });

        if (!response.ok) {
          throw new Error(`SMS API returned ${response.status}`);
        }

        const result = await response.json();
        if (result.success) {
          console.info(`SMS sent successfully to ${formattedPhone.slice(-4)}`);
          await this.updateNotificationStatus(notificationId, 'sent');
          return true;
        } else {
          throw new Error(result.error || 'Failed to send SMS');
        }
      } catch (error) {
        lastError = error as Error;
        console.warn(`SMS send attempt ${attempt} failed:`, error);
        
        if (attempt < this.MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    await this.updateNotificationStatus(notificationId, 'failed', lastError?.message);
    throw new Error(`Failed to send SMS after ${this.MAX_RETRIES} attempts: ${lastError?.message}`);
  }

  public async sendEmail(to: string, subject: string, text: string): Promise<boolean> {
    // Create notification record
    const notificationId = await this.createNotificationRecord('email', to, text);

    try {
      const resend = this.getResendClient();
      const response = await resend.emails.send({
        from: 'onboarding@resend.dev',
        to,
        subject,
        text
      });

      if (!response || response.error) {
        throw new Error(response?.error?.message || 'Failed to send email');
      }

      console.log(`Email sent successfully to ${to}`);
      await this.updateNotificationStatus(notificationId, 'sent');
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      await this.updateNotificationStatus(notificationId, 'failed', (error as Error).message);
      throw error;
    }
  }

  public async sendWhatsApp(phoneNumber: string, templateData: WhatsAppTemplateData): Promise<boolean> {
    if (!this.isValidPhoneNumber(phoneNumber)) {
      throw new Error(`Invalid phone number format: ${phoneNumber}`);
    }

    const formattedPhone = this.formatPhoneNumber(phoneNumber);
    const message = `Dear Parent/Guardian,\n\nPayment confirmation for ${templateData.studentName} (Admission No: ${templateData.admissionNumber})\nAmount: KES ${templateData.amount}\nSchool: ${templateData.schoolName}\n\nReceipt: ${templateData.receiptUrl || 'Not available'}`;

    // Create notification record
    const notificationId = await this.createNotificationRecord('whatsapp', phoneNumber, message);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/notifications/whatsapp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber: formattedPhone,
        message
      })
    });

    if (!response.ok) {
      await this.updateNotificationStatus(notificationId, 'failed', `WhatsApp API returned ${response.status}`);
      throw new Error(`WhatsApp API returned ${response.status}`);
    }

    const result = await response.json();
    if (result.success) {
      console.info(`WhatsApp message sent successfully to ${formattedPhone.slice(-4)}`);
      await this.updateNotificationStatus(notificationId, 'sent');
      return true;
    } else {
      await this.updateNotificationStatus(notificationId, 'failed', result.error || 'Failed to send WhatsApp message');
      throw new Error(result.error || 'Failed to send WhatsApp message');
    }
  }

  public async getNotificationHistory(): Promise<Notification[]> {
    if (!this.schoolId) {
      throw new Error('School ID not set. Call setSchoolId() before getting notifications.');
    }

    if (!navigator.onLine) {
      // Get from IndexedDB
      const db = await getDB();
      const records = await db.getAllFromIndex('notifications', 'by-school', this.schoolId) as IndexedDBNotification[];
      return records.map(record => ({
        id: record.id,
        type: record.type,
        message: record.message,
        recipient_email: record.recipient_email,
        recipient_phone: record.recipient_phone,
        status: record.status,
        error_message: record.error_message,
        school_id: record.school_id,
        sent_at: record.sent_at,
        created_at: record.created_at,
        updated_at: record.updated_at
      }));
    } else {
      // Get from Supabase
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('school_id', this.schoolId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance(); 