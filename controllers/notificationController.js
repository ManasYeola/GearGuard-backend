const { Notification } = require('../models');

const parsePositiveInt = (value, fallback) => {
  const n = Number.parseInt(value, 10);
  return Number.isNaN(n) || n <= 0 ? fallback : n;
};

exports.getMyNotifications = async (req, res) => {
  try {
    const page = parsePositiveInt(req.query.page, 1);
    const limit = Math.min(parsePositiveInt(req.query.limit, 20), 100);
    const offset = (page - 1) * limit;

    const where = { userId: req.user.id };
    if (req.query.unreadOnly === 'true') {
      where.isRead = false;
    }
    if (req.query.type) {
      where.type = req.query.type;
    }

    const { count, rows } = await Notification.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    const unreadCount = await Notification.count({
      where: { userId: req.user.id, isRead: false },
    });

    res.status(200).json({
      success: true,
      data: rows,
      meta: {
        page,
        limit,
        total: count,
        unreadCount,
        totalPages: Math.ceil(count / limit) || 1,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message,
    });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Notification.count({
      where: { userId: req.user.id, isRead: false },
    });

    res.status(200).json({
      success: true,
      data: { unreadCount },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching unread count',
      error: error.message,
    });
  }
};

exports.markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await notification.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error updating notification',
      error: error.message,
    });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const [updated] = await Notification.update(
      { isRead: true, readAt: new Date() },
      {
        where: {
          userId: req.user.id,
          isRead: false,
        },
      }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      data: { updated },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error marking notifications as read',
      error: error.message,
    });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const deleted = await Notification.destroy({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error deleting notification',
      error: error.message,
    });
  }
};
