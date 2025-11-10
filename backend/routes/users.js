const express = require('express');
const { supabase } = require('../config/database');
const { validate, schemas } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        id, name, email, roll_no, college, degree, course, year,
        profile_picture, bio, about, skills, resume_url,
        github_url, linkedin_url, phone, role, is_verified, created_at, updated_at
      `)
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found',
        error: 'Profile Not Found'
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
      createdAt: user.created_at,
      updatedAt: user.updated_at
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
      error: 'Fetch Failed'
    });
  }
});

// @route   GET /api/users/profile/stats
// @desc    Get current user profile statistics
// @access  Private
router.get('/profile/stats', authenticateToken, async (req, res) => {
  try {
    // Get user's experiences count
    const { count: experiencesCount, error: expError } = await supabase
      .from('experiences')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user.id)
      .eq('status', 'approved');

    // Get user's comments count
    const { count: commentsCount, error: commError } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user.id);

    // Get total views for user's experiences
    const { data: experiences, error: viewsError } = await supabase
      .from('experiences')
      .select('views_count')
      .eq('user_id', req.user.id)
      .eq('status', 'approved');

    if (expError || commError || viewsError) {
      console.error('Stats fetch error:', expError || commError || viewsError);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch profile statistics',
        error: 'Stats Fetch Failed'
      });
    }

    const totalViews = experiences?.reduce((sum, exp) => sum + (exp.views_count || 0), 0) || 0;

    res.json({
      success: true,
      data: {
        postsPublished: experiencesCount || 0,
        commentsMade: commentsCount || 0,
        totalViews: totalViews
      }
    });

  } catch (error) {
    console.error('Get profile stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching profile statistics',
      error: 'Stats Fetch Failed'
    });
  }
});

// @route   GET /api/users/profile/experiences
// @desc    Get current user's experiences
// @access  Private
router.get('/profile/experiences', authenticateToken, async (req, res) => {
  try {
    const { data: experiences, error } = await supabase
      .from('experiences')
      .select(`
        id, title, role, experience_type, result, interview_date, status,
        views_count, created_at, updated_at,
        companies!inner(id, name, slug)
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('User experiences fetch error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch user experiences',
        error: 'Fetch Failed'
      });
    }

    const formattedExperiences = experiences.map(exp => ({
      id: exp.id,
      title: exp.title,
      role: exp.role,
      experienceType: exp.experience_type,
      result: exp.result,
      interviewDate: exp.interview_date,
      status: exp.status,
      views: exp.views_count || 0,
      createdAt: exp.created_at,
      updatedAt: exp.updated_at,
      company: {
        id: exp.companies.id,
        name: exp.companies.name,
        slug: exp.companies.slug
      }
    }));

    res.json({
      success: true,
      data: { experiences: formattedExperiences }
    });

  } catch (error) {
    console.error('Get user experiences error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching user experiences',
      error: 'Fetch Failed'
    });
  }
});

// @route   GET /api/users/profile/comments
// @desc    Get current user's comments
// @access  Private
router.get('/profile/comments', authenticateToken, async (req, res) => {
  try {
    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        id, content, created_at,
        experiences!inner(id, title, role, companies!inner(name))
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('User comments fetch error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch user comments',
        error: 'Fetch Failed'
      });
    }

    const formattedComments = comments.map(comment => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.created_at,
      experienceTitle: `${comment.experiences.companies.name} - ${comment.experiences.role}`,
      experienceId: comment.experiences.id
    }));

    res.json({
      success: true,
      data: { comments: formattedComments }
    });

  } catch (error) {
    console.error('Get user comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching user comments',
      error: 'Fetch Failed'
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', validate(schemas.updateProfile), async (req, res) => {
  try {
    const updates = {};
    const allowedFields = [
      'name', 'rollNo', 'college', 'degree', 'course', 'year',
      'bio', 'about', 'skills', 'githubUrl', 'linkedinUrl', 'phone',
      'profilePicture', 'resumeUrl'
    ];

    // Map frontend field names to database field names
    const fieldMapping = {
      rollNo: 'roll_no',
      githubUrl: 'github_url',
      linkedinUrl: 'linkedin_url',
      profilePicture: 'profile_picture',
      resumeUrl: 'resume_url'
    };

    // Build update object with only provided fields
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        const dbField = fieldMapping[field] || field;
        updates[dbField] = req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields provided for update',
        error: 'No Updates'
      });
    }

    updates.updated_at = new Date().toISOString();

    // Update user profile
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.user.id)
      .select(`
        id, name, email, roll_no, college, degree, course, year,
        profile_picture, bio, about, skills, resume_url,
        github_url, linkedin_url, phone, role, is_verified, created_at, updated_at
      `)
      .single();

    if (error) {
      console.error('Profile update error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update profile',
        error: 'Update Failed'
      });
    }

    const userResponse = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      rollNo: updatedUser.roll_no,
      college: updatedUser.college,
      degree: updatedUser.degree,
      course: updatedUser.course,
      year: updatedUser.year,
      profilePicture: updatedUser.profile_picture,
      bio: updatedUser.bio,
      about: updatedUser.about,
      skills: updatedUser.skills || [],
      resumeUrl: updatedUser.resume_url,
      githubUrl: updatedUser.github_url,
      linkedinUrl: updatedUser.linkedin_url,
      phone: updatedUser.phone,
      role: updatedUser.role,
      isVerified: updatedUser.is_verified,
      createdAt: updatedUser.created_at,
      updatedAt: updatedUser.updated_at
    };

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: userResponse }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during profile update',
      error: 'Update Failed'
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get user profile by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
        error: 'Invalid ID'
      });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select(`
        id, name, college, degree, course, year,
        profile_picture, bio, about, skills,
        github_url, linkedin_url, role, created_at
      `)
      .eq('id', id)
      .eq('is_active', true)
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
      college: user.college,
      degree: user.degree,
      course: user.course,
      year: user.year,
      profilePicture: user.profile_picture,
      bio: user.bio,
      about: user.about,
      skills: user.skills || [],
      githubUrl: user.github_url,
      linkedinUrl: user.linkedin_url,
      role: user.role,
      createdAt: user.created_at
    };

    res.json({
      success: true,
      data: { user: userResponse }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching user',
      error: 'Fetch Failed'
    });
  }
});

// @route   GET /api/users/:id/experiences
// @desc    Get user's experiences
// @access  Public
router.get('/:id/experiences', async (req, res) => {
  try {
    const { id } = req.params;
    const { status = 'approved', page = 1, limit = 10 } = req.query;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
        error: 'Invalid ID'
      });
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase
      .from('experiences')
      .select(`
        id, title, role, experience_type, result, interview_date,
        location, difficulty_level, overall_rating, views_count,
        likes_count, comments_count, created_at,
        companies (id, name, slug, logo_url, category, tier)
      `)
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    // If requesting user's own experiences, show all statuses
    if (!req.user || req.user.id !== id) {
      query = query.eq('status', 'approved');
    }

    const { data: experiences, error, count } = await query;

    if (error) {
      console.error('Get user experiences error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch user experiences',
        error: 'Fetch Failed'
      });
    }

    const totalPages = Math.ceil(count / parseInt(limit));

    res.json({
      success: true,
      data: {
        experiences: experiences || [],
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: count,
          itemsPerPage: parseInt(limit),
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Get user experiences error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching experiences',
      error: 'Fetch Failed'
    });
  }
});

// @route   GET /api/users/:id/stats
// @desc    Get user's statistics
// @access  Public
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
        error: 'Invalid ID'
      });
    }

    // Get experience counts
    const { data: experienceStats, error: expError } = await supabase
      .from('experiences')
      .select('status, result')
      .eq('user_id', id);

    if (expError) {
      console.error('Get experience stats error:', expError);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch user statistics',
        error: 'Fetch Failed'
      });
    }

    // Get comment count
    const { count: commentCount, error: commentError } = await supabase
      .from('comments')
      .select('id', { count: 'exact' })
      .eq('user_id', id)
      .eq('is_active', true);

    if (commentError) {
      console.error('Get comment count error:', commentError);
    }

    // Calculate statistics
    const totalExperiences = experienceStats.length;
    const approvedExperiences = experienceStats.filter(exp => exp.status === 'approved').length;
    const pendingExperiences = experienceStats.filter(exp => exp.status === 'pending').length;
    const selectedExperiences = experienceStats.filter(exp => exp.result === 'Selected').length;

    // Get total views and likes for approved experiences
    const { data: engagementStats, error: engagementError } = await supabase
      .from('experiences')
      .select('views_count, likes_count')
      .eq('user_id', id)
      .eq('status', 'approved');

    let totalViews = 0;
    let totalLikes = 0;

    if (!engagementError && engagementStats) {
      totalViews = engagementStats.reduce((sum, exp) => sum + (exp.views_count || 0), 0);
      totalLikes = engagementStats.reduce((sum, exp) => sum + (exp.likes_count || 0), 0);
    }

    const stats = {
      experiences: {
        total: totalExperiences,
        approved: approvedExperiences,
        pending: pendingExperiences,
        selected: selectedExperiences,
        successRate: totalExperiences > 0 ? Math.round((selectedExperiences / totalExperiences) * 100) : 0
      },
      engagement: {
        totalViews,
        totalLikes,
        totalComments: commentCount || 0
      }
    };

    res.json({
      success: true,
      data: { stats }
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching statistics',
      error: 'Fetch Failed'
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get user profile by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
        error: 'Invalid ID'
      });
    }

    // Get user details (public info only)
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        id, name, email, roll_no, college, degree, course, year,
        profile_picture, bio, about, skills,
        github_url, linkedin_url, is_verified, created_at
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error || !user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'User Not Found'
      });
    }

    // Get user's approved experiences
    const { data: experiences, error: expError } = await supabase
      .from('experiences')
      .select(`
        id, role, experience_type, result, interview_date, views_count, created_at,
        companies (id, name, slug, logo_url)
      `)
      .eq('user_id', id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(10);

    if (expError) {
      console.error('Get user experiences error:', expError);
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
      githubUrl: user.github_url,
      linkedinUrl: user.linkedin_url,
      isVerified: user.is_verified,
      createdAt: user.created_at
    };

    res.json({
      success: true,
      data: {
        user: userResponse,
        experiences: experiences || []
      }
    });

  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching user',
      error: 'Fetch Failed'
    });
  }
});

module.exports = router;