import User from '../models/User.js';
import { generateTokens } from '../middleware/auth.js';

export async function login(req, res) {
  try {
    const { email, password, role } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user by email and check role if provided
    const query = { email: email.toLowerCase() };
    if (role) {
      query.role = role;
    }
    
    const user = await User.findOne(query);

    // Check if user exists
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate tokens
    const { token, refreshToken } = generateTokens(user._id, user.role);

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      },
      token,
      refreshToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export async function register(req, res) {
  try {
    const { 
      firstName, 
      lastName, 
      email, 
      password, 
      phone, 
      role, 
      address, 
      licenseNumber, 
      schoolName,
      department 
    } = req.body;

    // Check if email already exists
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Create user based on role with appropriate validations
    const userData = {
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      phone,
      role,
      department,
      schoolName,
      isActive: true
    };

    // Add role-specific fields
    if (role === 'parent' && address) {
      userData.address = address;
    } else if (role === 'parent' && !address) {
      return res.status(400).json({
        success: false,
        message: 'Address is required for parents'
      });
    }

    if (role === 'driver' && licenseNumber) {
      userData.licenseNumber = licenseNumber;
    } else if (role === 'driver' && !licenseNumber) {
      return res.status(400).json({
        success: false,
        message: 'License number is required for drivers'
      });
    }
{/*
    if (role === 'admin' && schoolName && department) {
      userData.schoolName = schoolName;
      userData.department = department;
    } else if (role === 'admin' && (!schoolName || !department)) {
      return res.status(400).json({
        success: false,
        message: 'School name and department are required for administrators'
      });
    }
*/}
    const user = await User.create(userData);

    // Generate tokens
    const { token, refreshToken } = generateTokens(user._id, user.role);

    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      },
      token,
      refreshToken
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Mongoose validation error
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export async function getUserProfile(req, res) {
  try {
    // req.user was set in the auth middleware
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export async function updateUserProfile(req, res) {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update basic fields
    user.firstName = req.body.firstName || user.firstName;
    user.lastName = req.body.lastName || user.lastName;
    user.email = req.body.email ? req.body.email.toLowerCase() : user.email;
    user.phone = req.body.phone || user.phone;
    user.avatar = req.body.avatar || user.avatar;
    
    // Update password if provided
    if (req.body.password) {
      user.password = req.body.password;
    }
    
    // Update role-specific fields
    if (user.role === 'parent') {
      user.address = req.body.address || user.address;
    } else if (user.role === 'driver') {
      user.licenseNumber = req.body.licenseNumber || user.licenseNumber;
    } else if (user.role === 'admin') {
      user.schoolName = req.body.schoolName || user.schoolName;
      user.department = req.body.department || user.department;
    }
    
    const updatedUser = await user.save();
    
    res.status(200).json({
      success: true,
      user: {
        id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        avatar: updatedUser.avatar
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    
    // Mongoose validation error
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export async function getAllUsers(req, res) {
  try {
    const users = await User.find({}).select('-password');
    
    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export async function getUserById(req, res) {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get user by id error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export async function getAllParents(req, res) {
  try {
    const parents = await User.find({ role: 'parent' }).select('-password');
    
    res.status(200).json({
      success: true,
      count: parents.length,
      parents
    });
  } catch (error) {
    console.error('Get all parents error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export async function getAllDrivers(req, res) {
  try {
    const drivers = await User.find({ role: 'driver' }).select('-password');
    
    res.status(200).json({
      success: true,
      count: drivers.length,
      drivers
    });
  } catch (error) {
    console.error('Get all drivers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export async function updateUser(req, res) {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update fields
    Object.keys(req.body).forEach(key => {
      if (key !== 'password') {
        user[key] = req.body[key];
      }
    });
    
    // Update password if provided
    if (req.body.password) {
      user.password = req.body.password;
    }
    
    const updatedUser = await user.save();
    
    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user: {
        id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        role: updatedUser.role,
        isActive: updatedUser.isActive
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export async function deleteUser(req, res) {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    await user.remove();
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export async function toggleUserStatus(req, res) {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    user.isActive = !user.isActive;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: user.isActive
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};