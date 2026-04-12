/**
 * Notification Service
 * Handles email notifications for GearGuard events
 */

// For now, we'll create a logging-based notification service
// In production, you would integrate with a real email provider like SendGrid, Nodemailer, etc.

class NotificationService {
  // Log notification (replace with email service later)
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

  // New request notification
  static notifyNewRequest(admin, request, equipment) {
    const subject = `[NEW REQUEST] #${request.requestNumber} - ${equipment.name}`;
    const body = `
      A new maintenance request has been created:
      
      Request ID: #${request.requestNumber}
      Equipment: ${equipment.name}
      Priority: ${request.priority}
      Issue Description: ${request.description}
      
      Please review and assign a technician.
      
      Link: http://localhost:3000/requests/${request.id}
    `;
    
    this.logNotification(admin.email, subject, body);
  }

  // Technician assigned notification
  static notifyTechnicianAssigned(technician, request, equipment, scheduledDate) {
    const subject = `[ASSIGNED] Maintenance Task #${request.requestNumber}`;
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
    
    this.logNotification(technician.email, subject, body);
  }

  // Request completed notification
  static notifyRequestCompleted(requester, technician, request, equipment) {
    const subject = `[COMPLETED] Your Request #${request.requestNumber} is Complete!`;
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
    
    this.logNotification(requester.email, subject, body);
  }

  // Status update notification
  static notifyStatusChange(recipient, request, oldStatus, newStatus) {
    const subject = `[UPDATE] Request #${request.requestNumber} Status Changed`;
    const body = `
      Your maintenance request status has been updated:
      
      Request ID: #${request.requestNumber}
      Old Status: ${oldStatus}
      New Status: ${newStatus}
      Updated: ${new Date().toLocaleString()}
      
      Link: http://localhost:3000/requests/${request.id}
    `;
    
    this.logNotification(recipient.email, subject, body);
  }

  // Overdue notification
  static notifyOverdue(admin, request, equipment) {
    const subject = `[OVERDUE] Request #${request.requestNumber} - Overdue Action Required`;
    const body = `
      A maintenance request is overdue:
      
      Request ID: #${request.requestNumber}
      Equipment: ${equipment.name}
      Scheduled Date: ${request.scheduledDate}
      Priority: ${request.priority}
      
      Please take action to resolve this request.
      
      Link: http://localhost:3000/requests/${request.id}
    `;
    
    this.logNotification(admin.email, subject, body);
  }

  // Performance metrics notification
  static notifyPerformanceUpdate(technician, stats) {
    const subject = `[METRICS] Your Performance Summary`;
    const body = `
      Your performance metrics for this period:
      
      Completed Tasks: ${stats.completed}
      Pending Tasks: ${stats.pending}
      Average Rating: ${stats.avgRating}/5
      On-Time Completion: ${stats.onTimePercentage}%
      
      Keep up the good work!
    `;
    
    this.logNotification(technician.email, subject, body);
  }

  // Service rating notification
  static notifyServiceRating(technician, request, rating, feedback) {
    const subject = `[FEEDBACK] Service Rating - Request #${request.requestNumber}`;
    const body = `
      You have received feedback on request #${request.requestNumber}:
      
      Rating: ${rating}/5 Stars
      Feedback: ${feedback || 'No additional comments'}
      
      Thank you for your work!
    `;
    
    this.logNotification(technician.email, subject, body);
  }
}

module.exports = NotificationService;
