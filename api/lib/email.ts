import { Resend } from 'resend';
import type { Complaint } from '../../src/types.js';

let resendClient: Resend | null | undefined;

function getResendClient(): Resend | null {
  if (resendClient !== undefined) return resendClient;
  const apiKey = process.env.RESEND_API_KEY;
  resendClient = apiKey ? new Resend(apiKey) : null;
  return resendClient;
}

// Complaint text comes from the public, so it must never be interpolated into HTML unescaped.
export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Notifies the assigned maintenance staff member by email as soon as a
// complaint is dispatched to them. Best-effort: failures are logged, never
// thrown, so a missing/invalid RESEND_API_KEY can't break complaint updates.
export async function sendComplaintAssignmentEmail(params: {
  to: string;
  staffName: string;
  complaint: Pick<
    Complaint,
    'trackingCode' | 'title' | 'description' | 'category' | 'priority' | 'locationBuilding' | 'locationRoom'
  >;
}): Promise<void> {
  const client = getResendClient();
  if (!client) {
    console.warn('RESEND_API_KEY not set; skipping complaint assignment email.');
    return;
  }

  const { to, staffName, complaint } = params;
  const fromAddress = process.env.RESEND_FROM_EMAIL || 'Centivate Facilities <onboarding@resend.dev>';
  const e = escapeHtml;

  try {
    const { error } = await client.emails.send({
      from: fromAddress,
      to,
      subject: `[Centivate] New task assigned — ${String(complaint.trackingCode).replace(/[\r\n]/g, ' ')}`,
      html: `
        <div style="font-family: sans-serif; font-size: 14px; color: #1e293b;">
          <p>Hi ${e(staffName)},</p>
          <p>You've just been assigned a new facility maintenance task on Centivate:</p>
          <table cellpadding="6" style="border-collapse: collapse; width: 100%; max-width: 480px;">
            <tr><td style="font-weight: bold; color: #475569;">Tracking Code</td><td>${e(complaint.trackingCode)}</td></tr>
            <tr><td style="font-weight: bold; color: #475569;">Title</td><td>${e(complaint.title)}</td></tr>
            <tr><td style="font-weight: bold; color: #475569;">Category</td><td>${e(complaint.category)}</td></tr>
            <tr><td style="font-weight: bold; color: #475569;">Priority</td><td>${e(complaint.priority)}</td></tr>
            <tr><td style="font-weight: bold; color: #475569;">Location</td><td>${e(complaint.locationBuilding)} — ${e(complaint.locationRoom)}</td></tr>
            <tr><td style="font-weight: bold; color: #475569;">Description</td><td>${e(complaint.description)}</td></tr>
          </table>
          <p style="margin-top: 16px;">Please check the Centivate Admin Dashboard for full details and to update its status.</p>
        </div>
      `,
    });
    if (error) {
      console.warn('Resend failed to send assignment email:', error);
    }
  } catch (err) {
    console.warn('Failed to send complaint assignment email:', err);
  }
}
