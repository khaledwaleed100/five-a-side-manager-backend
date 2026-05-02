import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
}, { timestamps: true });

const Feedback = mongoose.model('Feedback', feedbackSchema);

export default Feedback;
export const create = (data) => Feedback.create(data);
export const find = (query) => Feedback.find(query);
export const countDocuments = () => Feedback.countDocuments();
