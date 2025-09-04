const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema(
	{
		path: { type: String, required: true },
		originalName: { type: String },
		mimeType: { type: String },
		size: { type: Number },
	},
	{ _id: false }
);

const messageSchema = new mongoose.Schema(
	{
		job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
		sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
		// Optional receiver role hint (operator | tekshiruvchi | yurist | admin)
		toRole: { type: String, enum: ['operator', 'tekshiruvchi', 'yurist', 'admin'], default: undefined },
		text: { type: String, default: '' },
		attachments: { type: [attachmentSchema], default: [] },
		// For file replacement flow: this message supersedes previous message id
		replacesMessageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
		createdAt: { type: Date, default: Date.now },
	},
	{ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

module.exports = mongoose.model('Message', messageSchema);

