const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { supabase } = require('../config/database');
const { validate, schemas } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Generate JWT tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );

  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
  );

  return { accessToken, refreshToken };
};

// Store refresh token in database
const storeRefreshToken = async (userId, refreshToken, deviceInfo, ipAddress) => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

  const { error } = await supabase
    .from('user_sessions')
    .insert({
      user_id: userId,
      refresh_token: refreshToken,
      device_info: deviceInfo,
      ip_address: ipAddress,
      expires_at: expiresAt.toISOString()
    });

  if (error) {
    console.error('Error storing refresh token:', error);
  }
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', validate(schemas.register), async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      rollNo,
      college,
      degree,
      course,
      year
    } = req.body;

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email',
        error: 'Email Already Registered'
      });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password_hash: passwordHash,
        roll_no: rollNo?.trim() || null,
        college: college.trim(),
        degree: degree.trim(),
        course: course.trim(),
        year: year.trim(),
        is_verified: false, // Email verification can be implemented later
        is_active: true,
        role: 'student'
      })
      .select('id, name, email, college, degree, course, year, role, is_verified, created_at')
      .single();

    if (error) {
      console.error('User creation error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create user account',
        error: 'Registration Failed'
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(newUser.id);

    // Store refresh token
    const deviceInfo = req.get('User-Agent') || 'Unknown Device';
    const ipAddress = req.ip || req.connection.remoteAddress;
    await storeRefreshToken(newUser.id, refreshToken, deviceInfo, ipAddress);

    // Remove sensitive data from response
    const userResponse = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      college: newUser.college,
      degree: newUser.degree,
      course: newUser.course,
      year: newUser.year,
      role: newUser.role,
      isVerified: newUser.is_verified,
      createdAt: newUser.created_at
    };

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        user: userResponse,
        accessToken,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during registration',
      error: 'Registration Failed'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', validate(schemas.login), async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        error: 'Authentication Failed'
      });
    }

    // Check if account is active
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.',
        error: 'Account Deactivated'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        error: 'Authentication Failed'
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    // Store refresh token
    const deviceInfo = req.get('User-Agent') || 'Unknown Device';
    const ipAddress = req.ip || req.connection.remoteAddress;
    await storeRefreshToken(user.id, refreshToken, deviceInfo, ipAddress);

    // Update last login
    await supabase
      .from('users')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', user.id);

    // Prepare user response
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      rollNo: user.roll_no,
      college: user.college,
      degree: user.degree,
      course: user.course,
      year: user.year,
      profilePicture: user.profile_picture,
      bio: user.bio,
      about: user.about,
      skills: user.skills || [],
      resumeUrl: user.resume_url,
      githubUrl: user.github_url,
      linkedinUrl: user.linkedin_url,
      phone: user.phone,
      role: user.role,
      isVerified: user.is_verified,
      createdAt: user.created_at
    };

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        accessToken,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login',
      error: 'Login Failed'
    });
  }
});

// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required',
        error: 'Token Required'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    
    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type',
        error: 'Invalid Token'
      });
    }

    // Check if refresh token exists in database and is active
    const { data: session, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('refresh_token', refreshToken)
      .eq('is_active', true)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (error || !session) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
        error: 'Token Invalid'
      });
    }

    // Get user details
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, email, role, is_active, is_verified')
      .eq('id', decoded.userId)
      .single();

    if (userError || !user || !user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive',
        error: 'User Invalid'
      });
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      { userId: user.id, type: 'access' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: newAccessToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.is_verified
        }
      }
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
        error: 'Token Invalid'
      });
    }

    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during token refresh',
      error: 'Refresh Failed'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (invalidate refresh token)
// @access  Private
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Deactivate the specific refresh token
      await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('refresh_token', refreshToken)
        .eq('user_id', req.user.id);
    } else {
      // Deactivate all sessions for the user
      await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('user_id', req.user.id);
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during logout',
      error: 'Logout Failed'
    });
  }
});

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', authenticateToken, validate(schemas.changePassword), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get current user with password
    const { data: user, error } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'User Not Found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
        error: 'Invalid Password'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        password_hash: newPasswordHash,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.user.id);

    if (updateError) {
      console.error('Password update error:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Failed to update password',
        error: 'Update Failed'
      });
    }

    // Invalidate all existing sessions except current one
    await supabase
      .from('user_sessions')
      .update({ is_active: false })
      .eq('user_id', req.user.id);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during password change',
      error: 'Password Change Failed'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        id, name, email, roll_no, college, degree, course, year,
        profile_picture, bio, about, skills, resume_url,
        github_url, linkedin_url, phone, role, is_verified, created_at
      `)
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'User Not Found'
      });
    }

    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      rollNo: user.roll_no,
      college: user.college,
      degree: user.degree,
      course: user.course,
      year: user.year,
      profilePicture: user.profile_picture,
      bio: user.bio,
      about: user.about,
      skills: user.skills || [],
      resumeUrl: user.resume_url,
      githubUrl: user.github_url,
      linkedinUrl: user.linkedin_url,
      phone: user.phone,
      role: user.role,
      isVerified: user.is_verified,
      createdAt: user.created_at
    };

    res.json({
      success: true,
      data: { user: userResponse }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching profile',
      error: 'Profile Fetch Failed'
    });
  }
});

module.exports = router;