const express = require('express');
const { supabase } = require('../config/database');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/companies
// @desc    Get all companies with filtering
// @access  Public
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      tier,
      search,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase
      .from('companies')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + parseInt(limit) - 1);

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }

    if (tier) {
      query = query.eq('tier', tier);
    }

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data: companies, error, count } = await query;

    if (error) {
      console.error('Get companies error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch companies',
        error: 'Fetch Failed'
      });
    }

    // Get experience counts for each company
    const companiesWithCounts = await Promise.all(
      companies.map(async (company) => {
        const { count: experienceCount } = await supabase
          .from('experiences')
          .select('id', { count: 'exact' })
          .eq('company_id', company.id)
          .eq('status', 'approved');

        return {
          ...company,
          experienceCount: experienceCount || 0
        };
      })
    );

    const totalPages = Math.ceil(count / parseInt(limit));

    res.json({
      success: true,
      data: {
        companies: companiesWithCounts,
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
    console.error('Get companies error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching companies',
      error: 'Fetch Failed'
    });
  }
});

// @route   GET /api/companies/:slug
// @desc    Get company by slug with experiences (college-specific)
// @access  Public
router.get('/:slug', optionalAuth, async (req, res) => {
  try {
    const { slug } = req.params;
    const {
      page = 1,
      limit = 10,
      experienceType,
      result,
      branch,
      sortBy = 'created_at',
      sortOrder = 'desc',
      college
    } = req.query;

    // Get company details
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (companyError || !company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found',
        error: 'Company Not Found'
      });
    }

    // Get experiences for this company
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let experienceQuery = supabase
      .from('experiences')
      .select(`
        id, title, role, experience_type, result, interview_date,
        location, difficulty_level, overall_rating, views_count,
        likes_count, comments_count, created_at,
        users (id, name, college, degree, course, year, profile_picture)
      `, { count: 'exact' })
      .eq('company_id', company.id)
      .eq('status', 'approved')
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + parseInt(limit) - 1);

    // COLLEGE FILTER - If user is logged in, filter by their college (case-insensitive)
    if (req.user) {
      const { data: userData } = await supabase
        .from('users')
        .select('college')
        .eq('id', req.user.id)
        .single();
      
      if (userData?.college) {
        // Note: Filtering on joined table fields needs to be done after fetching
        // We'll filter in the application layer
      }
    }

    // Apply other filters
    if (experienceType) {
      experienceQuery = experienceQuery.eq('experience_type', experienceType);
    }

    if (result) {
      experienceQuery = experienceQuery.eq('result', result);
    }

    if (branch) {
      experienceQuery = experienceQuery.eq('users.course', branch);
    }

    const { data: experiences, error: expError, count } = await experienceQuery;

    if (expError) {
      console.error('Get company experiences error:', expError);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch company experiences',
        error: 'Fetch Failed'
      });
    }

    // Get company statistics (college-specific)
    let statsQuery = supabase
      .from('experiences')
      .select('result, experience_type, users!inner(college)')
      .eq('company_id', company.id)
      .eq('status', 'approved');

    // Apply college filter to stats as well
    if (req.user) {
      const { data: userData } = await supabase
        .from('users')
        .select('college')
        .eq('id', req.user.id)
        .single();
      
      if (userData?.college) {
        statsQuery = statsQuery.eq('users.college', userData.college);
      }
    } else if (college) {
      statsQuery = statsQuery.eq('users.college', college);
    }

    const { data: stats } = await statsQuery;

    const totalExperiences = stats?.length || 0;
    const selectedCount = stats?.filter(exp => exp.result === 'Selected').length || 0;
    const internshipCount = stats?.filter(exp => exp.experience_type === 'Internship').length || 0;
    const fullTimeCount = stats?.filter(exp => exp.experience_type === 'Full-Time').length || 0;

    const companyStats = {
      totalExperiences,
      selectedCount,
      internshipCount,
      fullTimeCount,
      successRate: totalExperiences > 0 ? Math.round((selectedCount / totalExperiences) * 100) : 0
    };

    const totalPages = Math.ceil(count / parseInt(limit));

    res.json({
      success: true,
      data: {
        company: {
          ...company,
          stats: companyStats
        },
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
    console.error('Get company error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching company',
      error: 'Fetch Failed'
    });
  }
});

// @route   GET /api/companies/categories/stats
// @desc    Get company categories and tiers with counts
// @access  Public
router.get('/categories/stats', async (req, res) => {
  try {
    const { data: companies, error } = await supabase
      .from('companies')
      .select('category, tier')
      .eq('is_active', true);

    if (error) {
      console.error('Get company stats error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch company statistics',
        error: 'Fetch Failed'
      });
    }

    // Count by category
    const categoryStats = companies.reduce((acc, company) => {
      acc[company.category] = (acc[company.category] || 0) + 1;
      return acc;
    }, {});

    // Count by tier
    const tierStats = companies.reduce((acc, company) => {
      acc[company.tier] = (acc[company.tier] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        categories: categoryStats,
        tiers: tierStats,
        totalCompanies: companies.length
      }
    });

  } catch (error) {
    console.error('Get company categories stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching statistics',
      error: 'Fetch Failed'
    });
  }
});

module.exports = router;