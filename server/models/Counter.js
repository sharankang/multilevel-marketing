const mongoose = require('mongoose');

// This schema is used to generate the auto-incrementing member_code (M1001, M1002)
const CounterSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
  },
  seq: {
    type: Number,
    default: 1000, // Start counting from 1000
  },
});

module.exports = mongoose.model('Counter', CounterSchema);