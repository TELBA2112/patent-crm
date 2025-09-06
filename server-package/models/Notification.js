const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
	{
		user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // direct user recipient (optional)
		role: { type: String, enum: ['admin', 'operator', 'tekshiruvchi', 'yurist'] }, // or by role
		job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
		type: { type: String, required: true }, // e.g., invoice_sent, receipt_uploaded, receipt_approved, job_completed, job_archived
		title: { type: String, required: true },
		message: { type: String, default: '' },
		link: { type: String },
		read: { type: Boolean, default: false },
		createdAt: { type: Date, default: Date.now },
	},
	{ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

module.exports = mongoose.model('Notification', notificationSchema);

