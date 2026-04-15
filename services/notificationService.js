/**
 * Notification Service
 * Handles in-app + optional email notifications for GearGuard events
 */
const nodemailer = require('nodemailer');
const { Notification } = require('../models');

class NotificationService {
  static transporter = null;

  static isEmailEnabled() {
    return (
      process.env.EMAIL_NOTIFICATIONS_ENABLED === 'true' &&
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

  static async sendEmail(recipient, subject, body) {
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
    });
  }

  static async dispatch(recipient, payload) {
    const {
      type,
      title,
      message,
      emailSubject,
      emailBody,
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

    await this.sendEmail(recipient, emailSubject || title, emailBody || message);
  }

  // New request notification
  static async notifyNewRequest(admin, request, equipment) {
    const subject = `[NEW REQUEST] #${request.requestNumber} - ${equipment.name}`;
    const message = `New maintenance request for ${equipment.name} (${request.priority} priority).`;
    const body = `
      A new maintenance request has been created:
      
      Request ID: #${request.requestNumber}
      Equipment: ${equipment.name}
      Priority: ${request.priority}
      Issue Description: ${request.description}
      
      Please review and assign a technician.
      
      Link: http://localhost:3000/requests/${request.id}
    `;

    await this.dispatch(admin, {
      type: 'new-request',
      title: `New Request #${request.requestNumber}`,
      message,
      emailSubject: subject,
      emailBody: body,
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
      
      Link: http://localhost:3000/requests/${request.id}
    `;

    await this.dispatch(technician, {
      type: 'assignment',
      title: `Assigned Request #${request.requestNumber}`,
      message,
      emailSubject: subject,
      emailBody: body,
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
    const subject = `[COMPLETED] Your Request #${request.requestNumber} is Complete!`;
    const message = `Your request #${request.requestNumber} for ${equipment.name} was completed.`;
    const body = `
      Your maintenance request has been completed:
      
      Request ID: #${request.requestNumber}
      Equipment: ${equipment.name}
      Technician: ${technician.name}
      Status: COMPLETED
      Completion Time: ${new Date(request.completedDate).toLocaleString()}
      
      Completion Notes: ${request.workNotes || 'No notes'}
      
      Please rate the service quality when you have time.
      Link: http://localhost:3000/requests/${request.id}
    `;

    await this.dispatch(requester, {
      type: 'completed',
      title: `Request #${request.requestNumber} Completed`,
      message,
      emailSubject: subject,
      emailBody: body,
      entityType: 'MaintenanceRequest',
      entityId: request.id,
      metadata: {
        requestNumber: request.requestNumber,
        technician: technician.name,
        equipmentName: equipment.name,
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
