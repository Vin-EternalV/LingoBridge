const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const sectionSchema = new Schema(
  {
    key: { type: String, required: true }, // reading, writing1, writing2, speaking1, speaking2, speaking3
    skill: { type: String, enum: ['reading', 'writing', 'speaking'], required: true },
    status: { type: String, enum: ['pending', 'done'], default: 'pending' },
    refId: { type: Schema.Types.ObjectId }, // the reading test / essay / speaking session of this section
    band: Number,
  },
  { _id: false }
);

const mockTestSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['short', 'full'], required: true },
    status: { type: String, enum: ['in_progress', 'completed'], default: 'in_progress' },
    sections: [sectionSchema],
    skillBands: { reading: Number, writing: Number, speaking: Number },
    overall: Number, // average of the skills taken, rounded to the nearest half band. Listening is not included.
    completedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('MockTest', mockTestSchema);
