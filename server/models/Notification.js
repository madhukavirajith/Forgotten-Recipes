const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      trim: true,
      default: 'Notification',
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      trim: true,
      default: 'general',
    },
    read: {
      type: Boolean,
      default: false,
    },
    actionUrl: {
      type: String,
      trim: true,
    },
    metadata: {
      referenceId: { type: mongoose.Schema.Types.ObjectId },
      senderName: { type: String, trim: true },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Notification', NotificationSchema);
