const express = require('express');
const { supabase } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Apply admin authentication to all routes
router.use(authenticateToken);
router.use(requireAdmin);

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Private (Admin only)
router.get('/dashboard', async (req, res) => {
  try {
    // Get experience statistics
    const { data: experiences } = await supabase
      .from('experiences')
      .select('status, result, experience_type, created_at');

    // Get user statistics
    const { count: totalUsers } = await supabase
      .from('users')
      .select('id', { count: 'exact' })
      .eq('is_active', true)
      .eq('role', 'student');

    // Get company statistics
    const { count: totalCompanies } = await supabase
      .from('companies')
      .select('id', { count: 'exact' })
      .eq('is_active', true);

    // Get comment statistics
    const { count: totalComments } = await supabase
      .from('comments')
      .select('id', { count: 'exact' })
      .eq('is_active', true);

    // Calculate experience statistics
    const totalExperiences = experiences?.length || 0;
    const pendingExperiences = experiences?.filter(exp => exp.status === 'pending').length || 0;
    const approvedExperiences = experiences?.filter(exp => exp.status === 'approved').length || 0;
    const rejectedExperiences = experiences?.filter(exp => exp.status === 'rejected').length || 0;
    const selectedExperiences = experiences?.filter(exp => exp.result === 'Selected').length || 0;
    const internshipExperiences = experiences?.filter(exp => exp.experience_type === 'Internship').length || 0;
    const fullTimeExperiences = experiences?.filter(exp => exp.experience_type === 'Full-Time').length || 0;

    // Calculate recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentExperiences = experiences?.filter(exp => 
      new Date(exp.created_at) >= sevenDaysAgo
    ).length || 0;

    const stats = {
      overview: {
        totalUsers: totalUsers || 0,
        totalCompanies: totalCompanies || 0,
        totalExperiences,
        totalComments: totalComments || 0
      },
      experiences: {
        total: totalExperiences,
        pending: pendingExperiences,
        approved: approvedExperiences,
        rejected: rejectedExperiences,
        selected: selectedExperiences,
        internships: internshipExperiences,
        fullTime: fullTimeExperiences,
        recent: recentExperiences,
        successRate: totalExperiences > 0 ? Math.round((selectedExperiences / totalExperiences) * 100) : 0
      }
    };

    res.json({
      success: true,
      data: { stats }
    });

  } catch (error) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching dashboard data',
      error: 'Fetch Failed'
    });
  }
});

// @route   GET /api/admin/experiences
// @desc    Get all experiences for admin review (college-specific for college admins)
// @access  Private (Admin only)
router.get('/experiences', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      sortBy = 'created_at',
      sortOrder = 'desc',
      college
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase
      .from('experiences')
      .select(`
        id, role, experience_type, result, status, interview_date,
        location, created_at, updated_at,
        companies (id, name, slug, logo_url, category, tier),
        users!experiences_user_id_fkey (id, name, email, college, degree, course, year)
      `, { count: 'exact' })
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + parseInt(limit) - 1);

    // Only filter by status if provided
    if (status) {
      query = query.eq('status', status);
    }

    // If admin has a specific college, filter by that college
    // (System admins can see all, college admins see only their college)
    const { data: adminData } = await supabase
      .from('users')
      .select('college')
      .eq('id', req.user.id)
      .single();

    if (adminData?.college && adminData.college !== 'System') {
      query = query.eq('users.college', adminData.college);
    } else if (college) {
      query = query.eq('users.college', college);
    }

    const { data: experiences, error, count } = await query;

    if (error) {
      console.error('Get admin experiences error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch experiences',
        error: 'Fetch Failed'
      });
    }

    // Debug logging
    console.log(`Admin experiences query - Status: ${status || 'ALL'}, Count: ${count}, Experiences: ${experiences?.length}`);
    if (!status) {
      const statusBreakdown = {
        pending: experiences?.filter(e => e.status === 'pending').length || 0,
        approved: experiences?.filter(e => e.status === 'approved').length || 0,
        rejected: experiences?.filter(e => e.status === 'rejected').length || 0
      };
      console.log('Status breakdown:', statusBreakdown);
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
    console.error('Get admin experiences error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching experiences',
      error: 'Fetch Failed'
    });
  }
});

// @route   GET /api/admin/experiences/:id
// @desc    Get single experience for admin review
// @access  Private (Admin only)
router.get('/experiences/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: experience, error} = await supabase
      .from('experiences')
      .select(`
        *,
        companies (id, name, slug, logo_url, category, tier, description),
        users!experiences_user_id_fkey (id, name, email, college, degree, course, year)
      `)
      .eq('id', id)
      .single();

    if (error || !experience) {
      return res.status(404).json({
        success: false,
        message: 'Experience not found',
        error: 'Experience Not Found'
      });
    }

    res.json({
      success: true,
      data: { experience }
    });

  } catch (error) {
    console.error('Get admin experience error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching experience',
      error: 'Fetch Failed'
    });
  }
});

// @route   PUT /api/admin/experiences/:id/approve
// @desc    Approve an experience
// @access  Private (Admin only)
router.put('/experiences/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if experience exists and is pending
    const { data: experience, error: checkError } = await supabase
      .from('experiences')
      .select('id, status, user_id')
      .eq('id', id)
      .single();

    if (checkError || !experience) {
      return res.status(404).json({
        success: false,
        message: 'Experience not found',
        error: 'Experience Not Found'
      });
    }

    if (experience.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Experience is not pending approval',
        error: 'Invalid Status'
      });
    }

    // Approve experience
    const { data: updatedExperience, error } = await supabase
      .from('experiences')
      .update({
        status: 'approved',
        approved_by: req.user.id,
        approved_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        id, title, role, status, approved_at,
        companies (name),
        users!experiences_user_id_fkey (id, name, email)
      `)
      .single();

    if (error) {
      console.error('Approve experience error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to approve experience',
        error: 'Approval Failed'
      });
    }

    // TODO: Send notification to user about approval
    // This would typically involve creating a notification record
    // and possibly sending an email

    res.json({
      success: true,
      message: 'Experience approved successfully',
      data: { experience: updatedExperience }
    });

  } catch (error) {
    console.error('Approve experience error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during experience approval',
      error: 'Approval Failed'
    });
  }
});

// @route   PUT /api/admin/experiences/:id/reject
// @desc    Reject an experience
// @access  Private (Admin only)
router.put('/experiences/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required and must be at least 10 characters long',
        error: 'Invalid Reason'
      });
    }

    // Check if experience exists and is pending
    const { data: experience, error: checkError } = await supabase
      .from('experiences')
      .select('id, status, user_id')
      .eq('id', id)
      .single();

    if (checkError || !experience) {
      return res.status(404).json({
        success: false,
        message: 'Experience not found',
        error: 'Experience Not Found'
      });
    }

    if (experience.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Experience is not pending approval',
        error: 'Invalid Status'
      });
    }

    // Reject experience
    const { data: updatedExperience, error } = await supabase
      .from('experiences')
      .update({
        status: 'rejected',
        rejection_reason: reason.trim(),
        approved_by: req.user.id,
        approved_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        id, title, role, status, rejection_reason, approved_at,
        companies (name),
        users!experiences_user_id_fkey (id, name, email)
      `)
      .single();

    if (error) {
      console.error('Reject experience error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to reject experience',
        error: 'Rejection Failed'
      });
    }

    // TODO: Send notification to user about rejection
    // This would typically involve creating a notification record
    // and possibly sending an email with the rejection reason

    res.json({
      success: true,
      message: 'Experience rejected successfully',
      data: { experience: updatedExperience }
    });

  } catch (error) {
    console.error('Reject experience error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during experience rejection',
      error: 'Rejection Failed'
    });
  }
});

// @route   DELETE /api/admin/experiences/:id
// @desc    Delete an experience (admin only)
// @access  Private (Admin only)
router.delete('/experiences/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if experience exists
    const { data: experience, error: checkError } = await supabase
      .from('experiences')
      .select('id, title, users!experiences_user_id_fkey(name, email)')
      .eq('id', id)
      .single();

    if (checkError || !experience) {
      return res.status(404).json({
        success: false,
        message: 'Experience not found',
        error: 'Experience Not Found'
      });
    }

    // Delete experience (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from('experiences')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Admin delete experience error:', deleteError);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete experience',
        error: 'Deletion Failed'
      });
    }

    res.json({
      success: true,
      message: 'Experience deleted successfully'
    });

  } catch (error) {
    console.error('Admin delete experience error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during experience deletion',
      error: 'Deletion Failed'
    });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users for admin management
// @access  Private (Admin only)
router.get('/users', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      college,
      course,
      year,
      isActive = 'true',
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase
      .from('users')
      .select(`
        id, name, email, roll_no, college, degree, course, year,
        is_active, is_verified, role, created_at
      `, { count: 'exact' })
      .neq('role', 'admin') // Don't show admin users
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + parseInt(limit) - 1);

    // Apply filters
    if (isActive !== 'all') {
      query = query.eq('is_active', isActive === 'true');
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,college.ilike.%${search}%`);
    }

    if (college) {
      query = query.eq('college', college);
    }

    if (course) {
      query = query.eq('course', course);
    }

    if (year) {
      query = query.eq('year', year);
    }

    const { data: users, error, count } = await query;

    if (error) {
      console.error('Get admin users error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch users',
        error: 'Fetch Failed'
      });
    }

    const totalPages = Math.ceil(count / parseInt(limit));

    res.json({
      success: true,
      data: {
        users: users || [],
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
    console.error('Get admin users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching users',
      error: 'Fetch Failed'
    });
  }
});

// @route   PUT /api/admin/users/:id/toggle-status
// @desc    Toggle user active status
// @access  Private (Admin only)
router.put('/users/:id/toggle-status', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists and is not admin
    const { data: user, error: checkError } = await supabase
      .from('users')
      .select('id, name, email, is_active, role')
      .eq('id', id)
      .single();

    if (checkError || !user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'User Not Found'
      });
    }

    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify admin users',
        error: 'Forbidden'
      });
    }

    // Toggle user status
    const newStatus = !user.is_active;
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({ is_active: newStatus })
      .eq('id', id)
      .select('id, name, email, is_active')
      .single();

    if (error) {
      console.error('Toggle user status error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update user status',
        error: 'Update Failed'
      });
    }

    res.json({
      success: true,
      message: `User ${newStatus ? 'activated' : 'deactivated'} successfully`,
      data: { user: updatedUser }
    });

  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during status update',
      error: 'Update Failed'
    });
  }
});

module.exports = router;