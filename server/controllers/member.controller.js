const Member = require('../models/Member');

// --- ROUTE HANDLER: Get My Profile ---
// This function runs after the 'protect' middleware has verified the token
// The 'protect' middleware adds the member's data to 'req.member'
exports.getMyProfile = async (req, res) => {
  try {
    // req.member is attached by the 'protect' middleware
    // We just send the data from req.member
    res.status(200).json({
      success: true,
      data: req.member,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// --- ROUTE HANDLER: Get My Downline ---
exports.getDownline = async (req, res) => {
  try {
    // req.member is attached by the 'protect' middleware
    const memberId = req.member._id;

    // Find the member and populate their left and right member details
    // 'populate' replaces the ObjectId with the actual member document
    const memberWithDownline = await Member.findById(memberId)
      .populate('left_member', 'name member_code joined_at') // Only get these fields
      .populate('right_member', 'name member_code joined_at');

    if (!memberWithDownline) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    res.status(200).json({
      success: true,
      left_member: memberWithDownline.left_member,
      right_member: memberWithDownline.right_member,
      left_count: memberWithDownline.left_count,
      right_count: memberWithDownline.right_count,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};