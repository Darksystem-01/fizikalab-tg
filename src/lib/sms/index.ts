export interface SmsProvider {
  sendSms(to: string, message: string): Promise<{ success: boolean; error?: string }>;
}

let cachedEskizToken: string | null = null;
let eskizTokenExpiry: number = 0;

/**
 * Eskiz.uz API Provider implementation for Uzbekistan SMS delivery.
 */
export class EskizSmsProvider implements SmsProvider {
  private email: string;
  private password: string;
  private from: string;

  constructor(email?: string, password?: string, from: string = "4546") {
    this.email = email || process.env.ESKIZ_EMAIL || "";
    this.password = password || process.env.ESKIZ_PASSWORD || "";
    this.from = from || process.env.ESKIZ_FROM || "4546";
  }

  private async getAuthToken(): Promise<string | null> {
    if (cachedEskizToken && Date.now() < eskizTokenExpiry) {
      return cachedEskizToken;
    }

    try {
      const formData = new FormData();
      formData.append("email", this.email);
      formData.append("password", this.password);

      const res = await fetch("https://notify.eskiz.uz/api/auth/login", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        console.error("[Eskiz] Auth failed:", res.status, res.statusText);
        return null;
      }

      const data = (await res.json()) as { data?: { token?: string } };
      if (data.data?.token) {
        cachedEskizToken = data.data.token;
        // Tokens typically valid for 30 days; refresh after 25 days
        eskizTokenExpiry = Date.now() + 25 * 24 * 60 * 60 * 1000;
        return cachedEskizToken;
      }
    } catch (err) {
      console.error("[Eskiz] Token acquisition exception:", err);
    }
    return null;
  }

  async sendSms(to: string, message: string): Promise<{ success: boolean; error?: string }> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        return { success: false, error: "SMS shlyuzi bilan ulanishda xatolik." };
      }

      // Format recipient: clean non-digits (e.g. 998901234567)
      const cleanPhone = to.replace(/\D/g, "");

      const formData = new FormData();
      formData.append("mobile_phone", cleanPhone);
      formData.append("message", message);
      formData.append("from", this.from);

      const res = await fetch("https://notify.eskiz.uz/api/message/sms/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("[Eskiz] Send SMS error response:", res.status, text);
        return { success: false, error: "SMS yuborishda xatolik yuz berdi." };
      }

      return { success: true };
    } catch (err) {
      console.error("[Eskiz] SMS sending exception:", err);
      return { success: false, error: "SMS provayderiga ulanishda kutilmagan xatolik." };
    }
  }
}

/**
 * Development SMS Provider that logs OTPs in the console for testing.
 * When in production, OTP codes are NEVER logged.
 */
export class DevSmsProvider implements SmsProvider {
  async sendSms(to: string, message: string): Promise<{ success: boolean; error?: string }> {
    if (process.env.NODE_ENV !== "production") {
      console.log(`\x1b[36m[SMS-DEV-SIMULATOR]\x1b[0m To: ${to} | Message: ${message}`);
    }
    return { success: true };
  }
}

/**
 * Returns configured SMS provider instance based on environment variables.
 */
export function getSmsProvider(): SmsProvider {
  if (process.env.ESKIZ_EMAIL && process.env.ESKIZ_PASSWORD) {
    return new EskizSmsProvider();
  }
  return new DevSmsProvider();
}
