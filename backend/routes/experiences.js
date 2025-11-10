const express = require('express');
const { supabase } = require('../config/database');
const { validate, schemas } = require('../middleware/validation');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/experiences
// @desc    Create a new experience (SIMPLIFIED)
// @access  Private
router.post('/', authenticateToken, validate(schemas.createExperience), async (req, res) => {
  try {
    const {
      companyId,
      customCompany,
      title,
      role,
      experienceType,
      campusType,
      result,
      interviewDate,
      location,
      overallExperience,
      technicalRounds,
      hrRounds,
      tipsAndAdvice
    } = req.body;

    let finalCompanyId = companyId;
    let companyName = '';

    // Handle "other" company option
    if (companyId === 'other') {
      if (!customCompany || customCompany.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Company name is required'
        });
      }

      const trimmedCompanyName = customCompany.trim();
      
      // Check if company already exists (case-insensitive)
      const { data: existingCompany } = await supabase
        .from('companies')
        .select('id, name')
        .ilike('name', trimmedCompanyName)
        .single();

      if (existingCompany) {
        finalCompanyId = existingCompany.id;
        companyName = existingCompany.name;
      } else {
        // Create new company
        const slug = trimmedCompanyName.toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim('-');

        const { data: newCompany, error: createError } = await supabase
          .from('companies')
          .insert({
            name: trimmedCompanyName,
            slug: slug,
            category: 'Other',
            tier: 'Unspecified',
            description: `Company added by user`
          })
          .select('id, name')
          .single();

        if (createError) {
          console.error('Error creating company:', createError);
          return res.status(500).json({
            success: false,
            message: 'Failed to create company'
          });
        }

        finalCompanyId = newCompany.id;
        companyName = newCompany.name;
      }
    } else {
      // Verify existing company
      const { data: existingCompany, error: companyError } = await supabase
        .from('companies')
        .select('id, name')
        .eq('id', companyId)
        .single();

      if (companyError || !existingCompany) {
        return res.status(404).json({
          success: false,
          message: 'Company not found'
        });
      }

      companyName = existingCompany.name;
    }

    // Create experience
    const { data: experience, error } = await supabase
      .from('experiences')
      .insert({
        user_id: req.user.id,
        company_id: finalCompanyId,
        title: title.trim(),
        role: role.trim(),
        experience_type: experienceType,
        campus_type: campusType,
        result: result,
        interview_date: interviewDate || null,
        location: location?.trim() || null,
        rounds_overview: overallExperience?.trim() || '',
        technical_questions: technicalRounds?.trim() || '',
        hr_questions: hrRounds?.trim() || '',
        preparation_strategy: tipsAndAdvice?.trim() || '',
        advice: '',
        overall_experience: overallExperience?.trim() || null,
        technical_rounds: technicalRounds?.trim() || null,
        hr_rounds: hrRounds?.trim() || null,
        tips_and_advice: tipsAndAdvice?.trim() || null,
        status: 'pending'
      })
      .select(`
        id, title, role, experience_type, campus_type, result, interview_date,
        location, status, created_at,
        companies (id, name, slug, logo_url)
      `)
      .single();

    if (error) {
      console.error('Experience creation error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create experience',
        error: error.message
      });
    }

    res.status(201).json({
      success: true,
      message: 'Experience submitted successfully! It will be reviewed by admins.',
      data: { experience }
    });

  } catch (error) {
    console.error('Create experience error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/experiences
// @desc    Get all approved experiences
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      company,
      experienceType,
      result,
      search
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase
      .from('experiences')
      .select(`
        id, role, experience_type, result, interview_date,
        location, views_count, likes_count, comments_count, created_at,
        companies (id, name, slug, logo_url),
        users!experiences_user_id_fkey (id, name, college, course, year)
      `, { count: 'exact' })
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    // Apply filters
    if (company) {
      query = query.eq('companies.slug', company);
    }

    if (experienceType) {
      query = query.eq('experience_type', experienceType);
    }

    if (result) {
      query = query.eq('result', result);
    }

    if (search) {
      query = query.or(`role.ilike.%${search}%,companies.name.ilike.%${search}%`);
    }

    const { data: experiences, error, count } = await query;

    if (error) {
      console.error('Get experiences error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch experiences'
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
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get experiences error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/experiences/:id
// @desc    Get single experience
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    let query = supabase
      .from('experiences')
      .select(`
        id, role, experience_type, result, interview_date,
        location, overall_experience, technical_rounds, hr_rounds,
        tips_and_advice, views_count, likes_count, comments_count,
        status, created_at,
        companies (id, name, slug, logo_url, category),
        users!experiences_user_id_fkey (id, name, college, course, year)
      `)
      .eq('id', id);

    if (!req.user) {
      query = query.eq('status', 'approved');
    }

    const { data: experience, error } = await query.single();

    if (error || !experience) {
      return res.status(404).json({
        success: false,
        message: 'Experience not found'
      });
    }

    // Check if user can view
    if (experience.status !== 'approved' && (!req.user || req.user.id !== experience.users.id)) {
      return res.status(404).json({
        success: false,
        message: 'Experience not found'
      });
    }

    // Increment view count
    if (experience.status === 'approved' && (!req.user || req.user.id !== experience.users.id)) {
      await supabase
        .from('experiences')
        .update({ views_count: (experience.views_count || 0) + 1 })
        .eq('id', id);
      
      experience.views_count = (experience.views_count || 0) + 1;
    }

    res.json({
      success: true,
      data: { experience }
    });

  } catch (error) {
    console.error('Get experience error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/experiences/:id
// @desc    Update experience
// @access  Private (Author only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      role,
      experienceType,
      result,
      interviewDate,
      location,
      overallExperience,
      technicalRounds,
      hrRounds,
      tipsAndAdvice
    } = req.body;

    // Check if experience exists and user is the author
    const { data: experience, error: checkError } = await supabase
      .from('experiences')
      .select('id, user_id, status')
      .eq('id', id)
      .single();

    if (checkError || !experience) {
      return res.status(404).json({
        success: false,
        message: 'Experience not found'
      });
    }

    if (experience.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Only allow editing pending experiences
    if (experience.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Can only edit pending experiences'
      });
    }

    // Update experience
    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (role) updateData.role = role.trim();
    if (experienceType) updateData.experience_type = experienceType;
    if (result) updateData.result = result;
    if (interviewDate !== undefined) updateData.interview_date = interviewDate || null;
    if (location !== undefined) updateData.location = location?.trim() || null;
    if (overallExperience !== undefined) updateData.overall_experience = overallExperience?.trim() || null;
    if (technicalRounds !== undefined) updateData.technical_rounds = technicalRounds?.trim() || null;
    if (hrRounds !== undefined) updateData.hr_rounds = hrRounds?.trim() || null;
    if (tipsAndAdvice !== undefined) updateData.tips_and_advice = tipsAndAdvice?.trim() || null;

    const { data: updatedExperience, error } = await supabase
      .from('experiences')
      .update(updateData)
      .eq('id', id)
      .select(`
        id, role, experience_type, result, status, created_at, updated_at,
        companies (id, name, slug, logo_url)
      `)
      .single();

    if (error) {
      console.error('Update experience error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update experience'
      });
    }

    res.json({
      success: true,
      message: 'Experience updated successfully',
      data: { experience: updatedExperience }
    });

  } catch (error) {
    console.error('Update experience error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/experiences/:id
// @desc    Delete experience
// @access  Private (Author only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: experience, error: checkError } = await supabase
      .from('experiences')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (checkError || !experience) {
      return res.status(404).json({
        success: false,
        message: 'Experience not found'
      });
    }

    if (experience.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const { error: deleteError } = await supabase
      .from('experiences')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete'
      });
    }

    res.json({
      success: true,
      message: 'Experience deleted'
    });

  } catch (error) {
    console.error('Delete experience error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
