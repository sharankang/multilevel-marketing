const Member = require('../models/Member');
const Counter = require('../models/Counter');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

async function getNextMemberCode() {
  const counter = await Counter.findByIdAndUpdate(
    'member_code',
    { $inc: { seq: 1 } },
    { new: true, upsert: true } 
  );
  return `M${counter.seq}`; 
}

async function findEmptySlot(sponsor, position) {
  let currentSponsor = sponsor;
  let currentPosition = position;

  while (true) {
    if (currentPosition === 'left') {
      if (!currentSponsor.left_member) {
        return { parent: currentSponsor, position: 'left' };
      }
      currentSponsor = await Member.findById(currentSponsor.left_member);
    } else { 
      if (!currentSponsor.right_member) {
        return { parent: currentSponsor, position: 'right' };
      }
      currentSponsor = await Member.findById(currentSponsor.right_member);
    }
  }
}

async function updateCountsUpwards(parent, position) {
  let currentMember = parent;
  let currentPosition = position;

  while (currentMember) {
    if (currentPosition === 'left') {
      currentMember.left_count += 1;
    } else {
      currentMember.right_count += 1;
    }
    
    // Save the change
    await currentMember.save();

    // Move up to the next ancestor
    const ancestor = await Member.findOne({
      $or: [
        { left_member: currentMember._id },
        { right_member: currentMember._id }
      ]
    });

    if (ancestor) {
      // Determine what position *this member* held for the ancestor
      currentPosition = (ancestor.left_member && ancestor.left_member.equals(currentMember._id)) ? 'left' : 'right';
    }
    currentMember = ancestor;
  }
}


exports.register = async (req, res) => {
  try {
    const { name, email, mobile, password, sponsor_code, position } = req.body;

    // 1. Validation: Check if sponsor code exists
    const sponsor = await Member.findOne({ member_code: sponsor_code });
    if (!sponsor) {
      return res.status(400).json({ success: false, message: 'Invalid Sponsor Code' });
    }

    // 2. Validation: Check if email or mobile already exists
    let existingMember = await Member.findOne({ $or: [{ email }, { mobile }] });
    if (existingMember) {
      return res.status(400).json({ success: false, message: 'Email or mobile number already exists' });
    }

    // 3. Spill Logic: Find the actual parent to place this member under
    const { parent, position: finalPosition } = await findEmptySlot(sponsor, position);

    // 4. Assign New Member
    // Get a new unique member code
    const newMemberCode = await getNextMemberCode();

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create the new member
    const newMember = new Member({
      name,
      email,
      mobile,
      password: hashedPassword,
      member_code: newMemberCode,
      sponsor_code, // The original sponsor
      parent_code: parent.member_code, // The parent they are placed under
      position: finalPosition, // The 'left' or 'right' slot they filled
    });
    
    // 5. Update Sponsor's/Parent's left/right reference
    if (finalPosition === 'left') {
      parent.left_member = newMember._id;
    } else {
      parent.right_member = newMember._id;
    }
    
    // Save both the new member and the parent's update
    await Promise.all([
      newMember.save(),
      parent.save()
    ]);

    // 6. Update counts recursively upward
    await updateCountsUpwards(parent, finalPosition);

    res.status(201).json({
      success: true,
      message: `Registration successful! Your Member Code is ${newMemberCode}`,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};


exports.login = async (req, res) => {
  try {
    const { member_code, password } = req.body;

    // Find the member by their member code and explicitly select the password
    const member = await Member.findOne({ member_code }).select('+password');
    if (!member) {
      return res.status(404).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if the password matches
    const isMatch = await bcrypt.compare(password, member.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Create a JSON Web Token (JWT)
    const token = jwt.sign({ id: member._id }, process.env.JWT_SECRET, {
      expiresIn: '1d', // Token expires in 1 day
    });

    res.status(200).json({
      success: true,
      token,
      member_code: member.member_code,
      name: member.name,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};


exports.setupRootMember = async (req, res) => {
  try {
    const rootMember = await Member.findOne({ member_code: 'M1000' });
    if (rootMember) {
      return res.status(400).json({ success: false, message: 'Root member M1000 already exists' });
    }

    // Create the counter
    await Counter.findByIdAndUpdate(
      'member_code',
      { seq: 1000 }, // Start sequence at 1000
      { upsert: true }
    );

    // Create the root member
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("rootpassword", salt); // Default password

    const newRoot = new Member({
      name: 'Company Root',
      email: 'root@company.com',
      mobile: '0000000000',
      password: hashedPassword,
      member_code: 'M1000',
      sponsor_code: 'NONE', // Root has no sponsor
      parent_code: 'NONE', // Root has no parent
      position: 'root',
    });

    await newRoot.save();
    res.status(201).json({ success: true, message: 'Root member M1000 and counter created' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};