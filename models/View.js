import mongoose from 'mongoose';

const viewSchema = new mongoose.Schema({
  listingId: {
    type: String, 
    required: true,
    index: true 
  },
  viewerId: {
    type: String, 
    required: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '24h'
  }
});

export default mongoose.model('View', viewSchema);