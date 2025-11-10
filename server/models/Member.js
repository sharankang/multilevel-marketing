const mongoose = require('mongoose');

const MemberSchema = new mongoose.Schema({
  // Personal Details
  name: {
    type: String,
    required: [true, 'Please provide a name'],
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email',
    ],
  },
  mobile: {
    type: String,
    required: [true, 'Please provide a mobile number'],
    unique: true,
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false, // Don't send password back in query results by default
  },
  
  // MLM Tree Structure Details
  member_code: {
    type: String,
    required: true,
    unique: true,
  },
  sponsor_code: {
    type: String,
    required: true,
  },
  // parent_code is the member this user is placed directly under (due to spill)
  parent_code: {
    type: String,
    required: true,
  },
  // The position this member holds in relation to their parent
  position: {
    type: String,
    enum: ['left', 'right','root'],
    required: true,
  },

  // Binary Tree Links (using references to other members)
  left_member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    default: null,
  },
  right_member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    default: null,
  },

  // Downline Counts
  left_count: {
    type: Number,
    default: 0,
  },
  right_count: {
    type: Number,
    default: 0,
  },

  // Timestamp
  joined_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Member', MemberSchema);