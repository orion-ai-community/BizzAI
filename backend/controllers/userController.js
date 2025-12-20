import User from "../models/User.js";

/**
 * @desc Get all users
 * @route GET /api/users
 * @access Private
 */
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/**
 * @desc Update user profile
 * @route PUT /api/users/:id
 * @access Private
 */
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, shopName } = req.body;

    // Validate that user is updating their own profile
    if (req.user._id.toString() !== id) {
      return res.status(403).json({ message: "Unauthorized: Cannot update other users' profiles" });
    }

    // Check if new email is already taken (if email is being changed)
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: id } });
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    // Update only allowed fields
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (shopName !== undefined) updateData.shopName = shopName;

    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        shopName: user.shopName,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/**
 * @desc Delete user account
 * @route DELETE /api/users/:id
 * @access Private
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate that user is deleting their own account
    if (req.user._id.toString() !== id) {
      return res.status(403).json({ message: "Unauthorized: Cannot delete other users" });
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User account deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
