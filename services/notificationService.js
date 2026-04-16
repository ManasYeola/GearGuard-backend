/**
 * Notification Service
 * Handles in-app + optional email notifications for GearGuard events
 */
const nodemailer = require('nodemailer');
const { Notification } = require('../models');

class NotificationService {
  static transporter = null;

  static getFrontendBaseUrl() {
    return process.env.FRONTEND_URL || 'http://localhost:3000';
  }

  static escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  static renderDetailsRows(rows = []) {
    return rows
      .map((row) => {
        return `
          <tr>
            <td style="padding:10px 14px;border-bottom:1px solid #e6ebf2;color:#5d6878;font-size:13px;font-weight:600;width:36%;">${this.escapeHtml(row.label)}</td>
            <td style="padding:10px 14px;border-bottom:1px solid #e6ebf2;color:#1f2937;font-size:14px;">${this.escapeHtml(row.value)}</td>
          </tr>
        `;
      })
      .join('');
  }

  static buildEmailHtml({ heading, intro, accent = '#2563eb', rows = [], ctaLabel, ctaUrl, footerNote }) {
    const detailsRows = this.renderDetailsRows(rows);
    const safeHeading = this.escapeHtml(heading);
    const safeIntro = this.escapeHtml(intro);
    const safeCtaLabel = this.escapeHtml(ctaLabel || 'Open Request');
    const safeCtaUrl = this.escapeHtml(ctaUrl || this.getFrontendBaseUrl());
    const safeFooterNote = this.escapeHtml(footerNote || 'This is an automated GearGuard notification.');

    return `
      <div style="margin:0;padding:24px;background:#f3f6fb;font-family:'Segoe UI',Tahoma,Arial,sans-serif;color:#1f2937;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #dbe4f0;border-radius:14px;overflow:hidden;">
          <tr>
            <td style="padding:20px 24px;background:${this.escapeHtml(accent)};">
              <div style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#dbeafe;font-weight:700;">GearGuard</div>
              <div style="margin-top:6px;font-size:22px;line-height:1.3;color:#ffffff;font-weight:700;">${safeHeading}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:22px 24px 10px 24px;">
              <p style="margin:0;font-size:15px;line-height:1.65;color:#334155;">${safeIntro}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;background:#f8fafc;">
                ${detailsRows}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 24px 28px 24px;">
              <a href="${safeCtaUrl}" style="display:inline-block;padding:12px 18px;background:${this.escapeHtml(accent)};color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;border-radius:8px;">${safeCtaLabel}</a>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px;border-top:1px solid #e2e8f0;color:#64748b;font-size:12px;line-height:1.5;">
              ${safeFooterNote}
            </td>
          </tr>
        </table>
      </div>
    `;
  }

  static isEmailEnabled() {
    const explicitlyDisabled = process.env.EMAIL_NOTIFICATIONS_ENABLED === 'false';

    return (
      !explicitlyDisabled &&
      !!process.env.SMTP_HOST &&
      !!process.env.SMTP_PORT &&
      !!process.env.SMTP_USER &&
      !!process.env.SMTP_PASS &&
      !!process.env.EMAIL_FROM
    );
  }

  static getTransporter() {
    if (!this.isEmailEnabled()) {
      return null;
    }

    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }

    return this.transporter;
  }

  static logNotification(recipient, subject, body) {
    console.log(`
    ========== NOTIFICATION ==========
    To: ${recipient}
    Subject: ${subject}
    --------------------------------
    ${body}
    ==================================
    `);
  }

  static async createInAppNotification({ recipient, type, title, message, entityType, entityId, metadata }) {
    if (!recipient?.id) return null;

    return Notification.create({
      userId: recipient.id,
      type: type || 'system',
      title,
      message,
      entityType: entityType || null,
      entityId: entityId || null,
      metadata: metadata || null,
    });
  }

  static async sendEmail(recipient, subject, body, htmlBody) {
    this.logNotification(recipient.email, subject, body);

    const transporter = this.getTransporter();
    if (!transporter || !recipient?.email) {
      return;
    }

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: recipient.email,
      subject,
      text: body,
      html: htmlBody,
    });
  }

  static async dispatch(recipient, payload) {
    const {
      type,
      title,
      message,
      emailSubject,
      emailBody,
      emailHtml,
      entityType,
      entityId,
      metadata,
    } = payload;

    await this.createInAppNotification({
      recipient,
      type,
      title,
      message,
      entityType,
      entityId,
      metadata,
    });

    await this.sendEmail(recipient, emailSubject || title, emailBody || message, emailHtml);
  }

  // New request notification
  static async notifyNewRequest(admin, request, equipment) {
    const requestLink = `${this.getFrontendBaseUrl()}/requests/${request.id}`;
    const subject = `[NEW REQUEST] #${request.requestNumber} - ${equipment.name}`;
    const message = `New maintenance request for ${equipment.name} (${request.priority} priority).`;
    const body = `
      A new maintenance request has been created:
      
      Request ID: #${request.requestNumber}
      Equipment: ${equipment.name}
      Priority: ${request.priority}
      Issue Description: ${request.description}
      
      Please review and assign a technician.
      
      Link: ${requestLink}
    `;

    const emailHtml = this.buildEmailHtml({
      heading: `New Request #${request.requestNumber}`,
      intro: `A new maintenance request has been raised for ${equipment.name}. Please review and assign a technician.`,
      accent: '#0b6e4f',
      rows: [
        { label: 'Request ID', value: `#${request.requestNumber}` },
        { label: 'Equipment', value: equipment.name },
        { label: 'Priority', value: request.priority },
        { label: 'Issue Description', value: request.description || 'No description provided' },
      ],
      ctaLabel: 'Review Request',
      ctaUrl: requestLink,
      footerNote: 'You are receiving this because you are an Admin/Manager in GearGuard.',
    });

    await this.dispatch(admin, {
      type: 'new-request',
      title: `New Request #${request.requestNumber}`,
      message,
      emailSubject: subject,
      emailBody: body,
      emailHtml,
      entityType: 'MaintenanceRequest',
      entityId: request.id,
      metadata: {
        requestNumber: request.requestNumber,
        equipmentName: equipment.name,
        priority: request.priority,
      },
    });
  }

  // Technician assigned notification
  static async notifyTechnicianAssigned(technician, request, equipment, scheduledDate) {
    const requestLink = `${this.getFrontendBaseUrl()}/requests/${request.id}`;
    const subject = `[ASSIGNED] Maintenance Task #${request.requestNumber}`;
    const message = `You were assigned request #${request.requestNumber} for ${equipment.name}.`;
    const body = `
      You have been assigned a new maintenance task:
      
      Request ID: #${request.requestNumber}
      Equipment: ${equipment.name}
      Serial Number: ${equipment.serialNumber}
      Priority: ${request.priority}
      Scheduled: ${scheduledDate}
      
      Description: ${request.description}
      
      Link: ${requestLink}
    `;

    const emailHtml = this.buildEmailHtml({
      heading: `Assigned Request #${request.requestNumber}`,
      intro: `You have been assigned maintenance work for ${equipment.name}.`,
      accent: '#1d4ed8',
      rows: [
        { label: 'Request ID', value: `#${request.requestNumber}` },
        { label: 'Equipment', value: equipment.name },
        { label: 'Serial Number', value: equipment.serialNumber || 'N/A' },
        { label: 'Priority', value: request.priority },
        { label: 'Scheduled', value: scheduledDate || 'Not scheduled yet' },
        { label: 'Description', value: request.description || 'No description provided' },
      ],
      ctaLabel: 'Open Task',
      ctaUrl: requestLink,
      footerNote: 'Please start work and keep progress updated in GearGuard.',
    });

    await this.dispatch(technician, {
      type: 'assignment',
      title: `Assigned Request #${request.requestNumber}`,
      message,
      emailSubject: subject,
      emailBody: body,
      emailHtml,
      entityType: 'MaintenanceRequest',
      entityId: request.id,
      metadata: {
        requestNumber: request.requestNumber,
        equipmentName: equipment.name,
        scheduledDate,
      },
    });
  }

  // Request completed notification
  static async notifyRequestCompleted(requester, technician, request, equipment) {
    const requestLink = `${this.getFrontendBaseUrl()}/requests/${request.id}`;
    const subject = `[ACTION NEEDED] Verify Request #${request.requestNumber}`;
    const message = `Request #${request.requestNumber} for ${equipment.name} was marked repaired and is awaiting your verification.`;
    const body = `
      A technician has marked your maintenance request as repaired:
      
      Request ID: #${request.requestNumber}
      Equipment: ${equipment.name}
      Technician: ${technician.name}
      Status: Awaiting Verification
      Completion Time: ${new Date(request.completedDate).toLocaleString()}
      
      Completion Notes: ${request.workNotes || 'No notes'}
      
      Please verify whether the issue is satisfactorily resolved.
      Link: ${requestLink}
    `;

    const emailHtml = this.buildEmailHtml({
      heading: `Verify Repair for #${request.requestNumber}`,
      intro: `The technician marked your request for ${equipment.name} as repaired. Please verify the repair to close the request.`,
      accent: '#0f766e',
      rows: [
        { label: 'Request ID', value: `#${request.requestNumber}` },
        { label: 'Equipment', value: equipment.name },
        { label: 'Technician', value: technician.name || 'Assigned Technician' },
        { label: 'Status', value: 'Awaiting Verification' },
        {
          label: 'Completion Time',
          value: request.completedDate ? new Date(request.completedDate).toLocaleString() : new Date().toLocaleString(),
        },
        { label: 'Completion Notes', value: request.workNotes || 'No notes' },
      ],
      ctaLabel: 'Verify Request',
      ctaUrl: requestLink,
      footerNote: 'Approve to close the request, or reopen it with feedback if additional work is required.',
    });

    await this.dispatch(requester, {
      type: 'completed',
      title: `Request #${request.requestNumber} Completed`,
      message,
      emailSubject: subject,
      emailBody: body,
      emailHtml,
      entityType: 'MaintenanceRequest',
      entityId: request.id,
      metadata: {
        requestNumber: request.requestNumber,
        technician: technician.name,
        equipmentName: equipment.name,
      },
    });
  }

  // Request reopened by requester notification (to technician)
  static async notifyRequestReopenedByRequester(technician, requester, request, equipment, feedback) {
    const requestLink = `${this.getFrontendBaseUrl()}/requests/${request.id}`;
    const requesterName = requester?.name || 'Requester';
    const equipmentName = equipment?.name || `Equipment #${request.equipmentId}`;
    const feedbackText = feedback || 'No additional feedback provided.';
    const subject = `[REOPENED] Request #${request.requestNumber} Needs Rework`;
    const message = `${requesterName} reopened request #${request.requestNumber}.`;
    const body = `
      A maintenance request has been reopened by the requester:

      Request ID: #${request.requestNumber}
      Equipment: ${equipmentName}
      Reopened By: ${requesterName}
      Current Status: In Progress

      Requester Feedback: ${feedbackText}

      Please review and continue the repair work.
      Link: ${requestLink}
    `;

    const emailHtml = this.buildEmailHtml({
      heading: `Request #${request.requestNumber} Reopened`,
      intro: `${requesterName} reported that the issue is not fully resolved and reopened the request.`,
      accent: '#b45309',
      rows: [
        { label: 'Request ID', value: `#${request.requestNumber}` },
        { label: 'Equipment', value: equipmentName },
        { label: 'Reopened By', value: requesterName },
        { label: 'Status', value: 'In Progress (Rework Required)' },
        { label: 'Requester Feedback', value: feedbackText },
      ],
      ctaLabel: 'Resume Work',
      ctaUrl: requestLink,
      footerNote: 'Use the requester feedback to complete the remaining work and mark repaired again.',
    });

    await this.dispatch(technician, {
      type: 'status-change',
      title: `Request #${request.requestNumber} Reopened`,
      message,
      emailSubject: subject,
      emailBody: body,
      emailHtml,
      entityType: 'MaintenanceRequest',
      entityId: request.id,
      metadata: {
        requestNumber: request.requestNumber,
        requester: requesterName,
        feedback: feedbackText,
      },
    });
  }

  // Verified and closed notifications (to requester and technician)
  static async notifyRequestVerifiedClosed(requester, technician, request, equipment, rating, feedback) {
    const requestLink = `${this.getFrontendBaseUrl()}/requests/${request.id}`;
    const equipmentName = equipment?.name || `Equipment #${request.equipmentId}`;
    const technicianName = technician?.name || 'Assigned Technician';
    const feedbackText = feedback || 'No additional comments';

    const requesterSubject = `[CLOSED] Request #${request.requestNumber} Verified Successfully`;
    const requesterMessage = `You verified and closed request #${request.requestNumber} (${rating}/5).`;
    const requesterBody = `
      You have successfully verified and closed your maintenance request:

      Request ID: #${request.requestNumber}
      Equipment: ${equipmentName}
      Technician: ${technicianName}
      Final Status: Closed (Verified)
      Your Rating: ${rating}/5
      Your Feedback: ${feedbackText}

      Link: ${requestLink}
    `;

    const requesterHtml = this.buildEmailHtml({
      heading: `Request #${request.requestNumber} Closed`,
      intro: `Thank you for verifying the repair. Your request is now fully closed.`,
      accent: '#166534',
      rows: [
        { label: 'Request ID', value: `#${request.requestNumber}` },
        { label: 'Equipment', value: equipmentName },
        { label: 'Technician', value: technicianName },
        { label: 'Status', value: 'Closed (Verified)' },
        { label: 'Your Rating', value: `${rating}/5` },
        { label: 'Your Feedback', value: feedbackText },
      ],
      ctaLabel: 'View Closed Request',
      ctaUrl: requestLink,
      footerNote: 'This request has been closed end-to-end after your verification.',
    });

    await this.dispatch(requester, {
      type: 'completed',
      title: `Request #${request.requestNumber} Closed`,
      message: requesterMessage,
      emailSubject: requesterSubject,
      emailBody: requesterBody,
      emailHtml: requesterHtml,
      entityType: 'MaintenanceRequest',
      entityId: request.id,
      metadata: {
        requestNumber: request.requestNumber,
        equipmentName,
        rating,
        feedback: feedbackText,
      },
    });

    if (!technician?.id) {
      return;
    }

    const technicianSubject = `[VERIFIED CLOSED] Request #${request.requestNumber}`;
    const technicianMessage = `Request #${request.requestNumber} was verified and closed by ${requester?.name || 'the requester'} (${rating}/5).`;
    const technicianBody = `
      Good news! Your repair work has been verified by the requester.

      Request ID: #${request.requestNumber}
      Equipment: ${equipmentName}
      Verified By: ${requester?.name || 'Requester'}
      Final Status: Closed (Verified)
      Rating Received: ${rating}/5
      Feedback: ${feedbackText}

      Link: ${requestLink}
    `;

    const technicianHtml = this.buildEmailHtml({
      heading: `Request #${request.requestNumber} Verified Closed`,
      intro: `Your work has been accepted by the requester and the request is now closed.`,
      accent: '#1d4ed8',
      rows: [
        { label: 'Request ID', value: `#${request.requestNumber}` },
        { label: 'Equipment', value: equipmentName },
        { label: 'Verified By', value: requester?.name || 'Requester' },
        { label: 'Status', value: 'Closed (Verified)' },
        { label: 'Rating Received', value: `${rating}/5` },
        { label: 'Feedback', value: feedbackText },
      ],
      ctaLabel: 'View Request',
      ctaUrl: requestLink,
      footerNote: 'Thank you for your work. Keep maintaining high service quality.',
    });

    await this.dispatch(technician, {
      type: 'rating',
      title: `Request #${request.requestNumber} Verified Closed`,
      message: technicianMessage,
      emailSubject: technicianSubject,
      emailBody: technicianBody,
      emailHtml: technicianHtml,
      entityType: 'MaintenanceRequest',
      entityId: request.id,
      metadata: {
        requestNumber: request.requestNumber,
        requester: requester?.name || 'Requester',
        rating,
        feedback: feedbackText,
      },
    });
  }

  // Status update notification
  static async notifyStatusChange(recipient, request, oldStatus, newStatus) {
    const subject = `[UPDATE] Request #${request.requestNumber} Status Changed`;
    const message = `Request #${request.requestNumber} moved from ${oldStatus} to ${newStatus}.`;
    const body = `
      Your maintenance request status has been updated:
      
      Request ID: #${request.requestNumber}
      Old Status: ${oldStatus}
      New Status: ${newStatus}
      Updated: ${new Date().toLocaleString()}
      
      Link: http://localhost:3000/requests/${request.id}
    `;

    await this.dispatch(recipient, {
      type: 'status-change',
      title: `Request #${request.requestNumber} Updated`,
      message,
      emailSubject: subject,
      emailBody: body,
      entityType: 'MaintenanceRequest',
      entityId: request.id,
      metadata: {
        requestNumber: request.requestNumber,
        oldStatus,
        newStatus,
      },
    });
  }

  // Overdue notification
  static async notifyOverdue(admin, request, equipment) {
    const subject = `[OVERDUE] Request #${request.requestNumber} - Overdue Action Required`;
    const message = `Request #${request.requestNumber} for ${equipment.name} is overdue.`;
    const body = `
      A maintenance request is overdue:
      
      Request ID: #${request.requestNumber}
      Equipment: ${equipment.name}
      Scheduled Date: ${request.scheduledDate}
      Priority: ${request.priority}
      
      Please take action to resolve this request.
      
      Link: http://localhost:3000/requests/${request.id}
    `;

    await this.dispatch(admin, {
      type: 'overdue',
      title: `Overdue Request #${request.requestNumber}`,
      message,
      emailSubject: subject,
      emailBody: body,
      entityType: 'MaintenanceRequest',
      entityId: request.id,
      metadata: {
        requestNumber: request.requestNumber,
        scheduledDate: request.scheduledDate,
        equipmentName: equipment.name,
      },
    });
  }

  // Performance metrics notification
  static async notifyPerformanceUpdate(technician, stats) {
    const subject = `[METRICS] Your Performance Summary`;
    const message = `Performance update: ${stats.completed} completed, ${stats.pending} pending.`;
    const body = `
      Your performance metrics for this period:
      
      Completed Tasks: ${stats.completed}
      Pending Tasks: ${stats.pending}
      Average Rating: ${stats.avgRating}/5
      On-Time Completion: ${stats.onTimePercentage}%
      
      Keep up the good work!
    `;

    await this.dispatch(technician, {
      type: 'performance',
      title: 'Performance Summary',
      message,
      emailSubject: subject,
      emailBody: body,
      metadata: stats,
    });
  }

  // Service rating notification
  static async notifyServiceRating(technician, request, rating, feedback) {
    const subject = `[FEEDBACK] Service Rating - Request #${request.requestNumber}`;
    const message = `You received a ${rating}/5 rating for request #${request.requestNumber}.`;
    const body = `
      You have received feedback on request #${request.requestNumber}:
      
      Rating: ${rating}/5 Stars
      Feedback: ${feedback || 'No additional comments'}
      
      Thank you for your work!
    `;

    await this.dispatch(technician, {
      type: 'rating',
      title: `New Rating for #${request.requestNumber}`,
      message,
      emailSubject: subject,
      emailBody: body,
      entityType: 'MaintenanceRequest',
      entityId: request.id,
      metadata: {
        requestNumber: request.requestNumber,
        rating,
        feedback: feedback || '',
      },
    });
  }
}

module.exports = NotificationService;
