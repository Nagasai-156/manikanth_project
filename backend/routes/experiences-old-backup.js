const express = require('express');
const { supabase } = require('../config/database');
const { validate, schemas } = require('../middleware/validation');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/experiences
// @desc    Create a new experience
// @access  Private
router.post('/', authenticateToken, validate(schemas.createExperience), async (req, res) => {
  try {
    const {
      companyId,
      customCompany,
      title,
      role,
      experienceType,
      result,
      interviewDate,
      salaryOffered,
      location,
      roundsOverview,
      technicalQuestions,
      hrQuestions,
      preparationStrategy,
      advice,
      difficultyLevel,
      overallRating,
      wouldRecommend,
      // Coding challenges fields
      codingPlatform,
      easyProblems,
      mediumProblems,
      hardProblems,
      codingDuration,
      programmingLanguages,
      additionalTopics,
      behavioralQuestions
    } = req.body;

    let finalCompanyId = companyId;
    let company;

    // Handle "other" company option
    if (companyId === 'other') {
      if (!customCompany || customCompany.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Company name is required when selecting "Other"',
          error: 'Custom Company Required'
        });
      }

      const companyName = customCompany.trim();
      
      // Check if company already exists (case-insensitive)
      const { data: existingCompany } = await supabase
        .from('companies')
        .select('id, name')
        .ilike('name', companyName)
        .single();

      if (existingCompany) {
        // Use existing company
        finalCompanyId = existingCompany.id;
        company = existingCompany;
      } else {
        // Create new company
        const slug = companyName.toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim('-');

        const { data: newCompany, error: createError } = await supabase
          .from('companies')
          .insert({
            name: companyName,
            slug: slug,
            category: 'Other',
            tier: 'Unspecified',
            description: `Company added by user: ${companyName}`
          })
          .select('id, name')
          .single();

        if (createError) {
          console.error('Error creating company:', createError);
          return res.status(500).json({
            success: false,
            message: 'Failed to create new company',
            error: 'Company Creation Failed'
          });
        }

        finalCompanyId = newCompany.id;
        company = newCompany;
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
          message: 'Company not found',
          error: 'Company Not Found'
        });
      }

      company = existingCompany;
    }

    // Generate title if not provided or too short
    let finalTitle = title?.trim() || '';
    if (!finalTitle || finalTitle.length < 5) {
      finalTitle = `${role.trim()} Interview Experience at ${company.name}`;
    }

    // Create experience
    const { data: experience, error } = await supabase
      .from('experiences')
      .insert({
        user_id: req.user.id,
        company_id: finalCompanyId,
        title: finalTitle,
        role: role.trim(),
        experience_type: experienceType,
        result,
        interview_date: interviewDate || null,
        salary_offered: salaryOffered || null,
        location: location?.trim() || null,
        rounds_overview: roundsOverview?.trim() || '',
        technical_questions: technicalQuestions?.trim() || '',
        hr_questions: hrQuestions?.trim() || null,
        preparation_strategy: preparationStrategy?.trim() || '',
        advice: advice?.trim() || '',
        difficulty_level: difficultyLevel || null,
        overall_rating: overallRating || null,
        would_recommend: wouldRecommend || null,
        status: 'pending' // All experiences need admin approval
      })
      .select(`
        id, title, role, experience_type, result, interview_date,
        salary_offered, location, difficulty_level, overall_rating,
        would_recommend, status, created_at,
        companies (id, name, slug, logo_url, category, tier)
      `)
      .single();

    if (error) {
      console.error('Experience creation error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create experience',
        error: 'Creation Failed'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Experience submitted successfully. It will be reviewed by admins before being published.',
      data: { experience }
    });

  } catch (error) {
    console.error('Create experience error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during experience creation',
      error: 'Creation Failed'
    });
  }
});

// @route   GET /api/experiences
// @desc    Get all approved experiences with filtering (college-specific)
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      company,
      experienceType,
      result,
      branch,
      year,
      search,
      sortBy = 'created_at',
      sortOrder = 'desc',
      college // Add college filter
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase
      .from('experiences')
      .select(`
        id, title, role, experience_type, result, interview_date,
        location, difficulty_level, overall_rating, views_count,
        likes_count, comments_count, created_at,
        companies (id, name, slug, logo_url, category, tier),
        users (id, name, college, degree, course, year)
      `, { count: 'exact' })
      .eq('status', 'approved')
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + parseInt(limit) - 1);

    // COLLEGE FILTER - If user is logged in, filter by their college
    if (req.user) {
      // Get user's college from database
      const { data: userData } = await supabase
        .from('users')
        .select('college')
        .eq('id', req.user.id)
        .single();
      
      if (userData?.college) {
        query = query.eq('users.college', userData.college);
      }
    } else if (college) {
      // If not logged in but college is specified, filter by that college
      query = query.eq('users.college', college);
    }

    // Apply other filters
    if (company) {
      query = query.eq('companies.slug', company);
    }

    if (experienceType) {
      query = query.eq('experience_type', experienceType);
    }

    if (result) {
      query = query.eq('result', result);
    }

    if (branch) {
      query = query.eq('users.course', branch);
    }

    if (year) {
      query = query.eq('users.year', year);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,role.ilike.%${search}%,companies.name.ilike.%${search}%`);
    }

    const { data: experiences, error, count } = await query;

    if (error) {
      console.error('Get experiences error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch experiences',
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
    console.error('Get experiences error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching experiences',
      error: 'Fetch Failed'
    });
  }
});

// @route   GET /api/experiences/:id
// @desc    Get single experience by ID
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid experience ID format',
        error: 'Invalid ID'
      });
    }

    let query = supabase
      .from('experiences')
      .select(`
        id, title, role, experience_type, result, interview_date,
        salary_offered, location, rounds_overview, technical_questions,
        hr_questions, preparation_strategy, advice, difficulty_level,
        overall_rating, would_recommend, views_count, likes_count,
        comments_count, status, created_at,
        companies (id, name, slug, logo_url, category, tier, description),
        users (id, name, college, degree, course, year, profile_picture)
      `)
      .eq('id', id);

    // If user is not the author, only show approved experiences
    if (!req.user) {
      query = query.eq('status', 'approved');
    }

    const { data: experience, error } = await query.single();

    if (error || !experience) {
      return res.status(404).json({
        success: false,
        message: 'Experience not found',
        error: 'Experience Not Found'
      });
    }

    // Check if user can view this experience
    if (experience.status !== 'approved' && (!req.user || req.user.id !== experience.users.id)) {
      return res.status(404).json({
        success: false,
        message: 'Experience not found',
        error: 'Experience Not Found'
      });
    }

    // Increment view count if experience is approved and viewer is not the author
    if (experience.status === 'approved' && (!req.user || req.user.id !== experience.users.id)) {
      await supabase
        .from('experiences')
        .update({ views_count: (experience.views_count || 0) + 1 })
        .eq('id', id);
      
      experience.views_count = (experience.views_count || 0) + 1;
    }

    // Check if current user has liked this experience
    let isLiked = false;
    if (req.user) {
      const { data: like } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', req.user.id)
        .eq('experience_id', id)
        .single();
      
      isLiked = !!like;
    }

    // Check if current user has bookmarked this experience
    let isBookmarked = false;
    if (req.user) {
      const { data: bookmark } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', req.user.id)
        .eq('experience_id', id)
        .single();
      
      isBookmarked = !!bookmark;
    }

    const responseData = {
      ...experience,
      isLiked,
      isBookmarked
    };

    res.json({
      success: true,
      data: { experience: responseData }
    });

  } catch (error) {
    console.error('Get experience error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching experience',
      error: 'Fetch Failed'
    });
  }
});

// @route   PUT /api/experiences/:id
// @desc    Update experience
// @access  Private (Author only)
router.put('/:id', authenticateToken, validate(schemas.createExperience), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if experience exists and user is the author
    const { data: existingExperience, error: checkError } = await supabase
      .from('experiences')
      .select('id, user_id, status')
      .eq('id', id)
      .single();

    if (checkError || !existingExperience) {
      return res.status(404).json({
        success: false,
        message: 'Experience not found',
        error: 'Experience Not Found'
      });
    }

    if (existingExperience.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own experiences',
        error: 'Forbidden'
      });
    }

    const {
      companyId,
      title,
      role,
      experienceType,
      result,
      interviewDate,
      salaryOffered,
      location,
      roundsOverview,
      technicalQuestions,
      hrQuestions,
      preparationStrategy,
      advice,
      difficultyLevel,
      overallRating,
      wouldRecommend
    } = req.body;

    // Verify company exists
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found',
        error: 'Company Not Found'
      });
    }

    // Update experience (reset to pending if it was approved)
    const updates = {
      company_id: companyId,
      title: title.trim(),
      role: role.trim(),
      experience_type: experienceType,
      result,
      interview_date: interviewDate || null,
      salary_offered: salaryOffered || null,
      location: location?.trim() || null,
      rounds_overview: roundsOverview.trim(),
      technical_questions: technicalQuestions.trim(),
      hr_questions: hrQuestions?.trim() || null,
      preparation_strategy: preparationStrategy.trim(),
      advice: advice.trim(),
      difficulty_level: difficultyLevel || null,
      overall_rating: overallRating || null,
      would_recommend: wouldRecommend || null,
      updated_at: new Date().toISOString()
    };

    // If experience was approved, reset to pending for re-review
    if (existingExperience.status === 'approved') {
      updates.status = 'pending';
    }

    const { data: updatedExperience, error } = await supabase
      .from('experiences')
      .update(updates)
      .eq('id', id)
      .select(`
        id, title, role, experience_type, result, interview_date,
        salary_offered, location, difficulty_level, overall_rating,
        would_recommend, status, updated_at,
        companies (id, name, slug, logo_url, category, tier)
      `)
      .single();

    if (error) {
      console.error('Experience update error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update experience',
        error: 'Update Failed'
      });
    }

    res.json({
      success: true,
      message: existingExperience.status === 'approved' 
        ? 'Experience updated successfully. It will be reviewed again before being published.'
        : 'Experience updated successfully.',
      data: { experience: updatedExperience }
    });

  } catch (error) {
    console.error('Update experience error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during experience update',
      error: 'Update Failed'
    });
  }
});

// @route   DELETE /api/experiences/:id
// @desc    Delete experience
// @access  Private (Author only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if experience exists and user is the author
    const { data: experience, error: checkError } = await supabase
      .from('experiences')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (checkError || !experience) {
      return res.status(404).json({
        success: false,
        message: 'Experience not found',
        error: 'Experience Not Found'
      });
    }

    if (experience.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own experiences',
        error: 'Forbidden'
      });
    }

    // Delete experience (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from('experiences')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Experience deletion error:', deleteError);
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
    console.error('Delete experience error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during experience deletion',
      error: 'Deletion Failed'
    });
  }
});

// @route   POST /api/experiences/:id/like
// @desc    Like/unlike an experience
// @access  Private
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if experience exists and is approved
    const { data: experience, error: expError } = await supabase
      .from('experiences')
      .select('id, likes_count')
      .eq('id', id)
      .eq('status', 'approved')
      .single();

    if (expError || !experience) {
      return res.status(404).json({
        success: false,
        message: 'Experience not found',
        error: 'Experience Not Found'
      });
    }

    // Check if user already liked this experience
    const { data: existingLike, error: likeError } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('experience_id', id)
      .single();

    if (likeError && likeError.code !== 'PGRST116') {
      console.error('Check like error:', likeError);
      return res.status(500).json({
        success: false,
        message: 'Failed to process like',
        error: 'Like Failed'
      });
    }

    let isLiked = false;
    let newLikesCount = experience.likes_count || 0;

    if (existingLike) {
      // Unlike - remove like
      const { error: deleteError } = await supabase
        .from('likes')
        .delete()
        .eq('id', existingLike.id);

      if (deleteError) {
        console.error('Unlike error:', deleteError);
        return res.status(500).json({
          success: false,
          message: 'Failed to unlike experience',
          error: 'Unlike Failed'
        });
      }

      newLikesCount = Math.max(0, newLikesCount - 1);
      isLiked = false;
    } else {
      // Like - add like
      const { error: insertError } = await supabase
        .from('likes')
        .insert({
          user_id: req.user.id,
          experience_id: id
        });

      if (insertError) {
        console.error('Like error:', insertError);
        return res.status(500).json({
          success: false,
          message: 'Failed to like experience',
          error: 'Like Failed'
        });
      }

      newLikesCount = newLikesCount + 1;
      isLiked = true;
    }

    // Update likes count
    const { error: updateError } = await supabase
      .from('experiences')
      .update({ likes_count: newLikesCount })
      .eq('id', id);

    if (updateError) {
      console.error('Update likes count error:', updateError);
    }

    res.json({
      success: true,
      message: isLiked ? 'Experience liked successfully' : 'Experience unliked successfully',
      data: {
        isLiked,
        likesCount: newLikesCount
      }
    });

  } catch (error) {
    console.error('Like/unlike error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during like operation',
      error: 'Like Failed'
    });
  }
});

// @route   POST /api/experiences/:id/bookmark
// @desc    Bookmark/unbookmark an experience
// @access  Private
router.post('/:id/bookmark', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if experience exists and is approved
    const { data: experience, error: expError } = await supabase
      .from('experiences')
      .select('id')
      .eq('id', id)
      .eq('status', 'approved')
      .single();

    if (expError || !experience) {
      return res.status(404).json({
        success: false,
        message: 'Experience not found',
        error: 'Experience Not Found'
      });
    }

    // Check if user already bookmarked this experience
    const { data: existingBookmark, error: bookmarkError } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('experience_id', id)
      .single();

    if (bookmarkError && bookmarkError.code !== 'PGRST116') {
      console.error('Check bookmark error:', bookmarkError);
      return res.status(500).json({
        success: false,
        message: 'Failed to process bookmark',
        error: 'Bookmark Failed'
      });
    }

    let isBookmarked = false;

    if (existingBookmark) {
      // Remove bookmark
      const { error: deleteError } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', existingBookmark.id);

      if (deleteError) {
        console.error('Remove bookmark error:', deleteError);
        return res.status(500).json({
          success: false,
          message: 'Failed to remove bookmark',
          error: 'Bookmark Failed'
        });
      }

      isBookmarked = false;
    } else {
      // Add bookmark
      const { error: insertError } = await supabase
        .from('bookmarks')
        .insert({
          user_id: req.user.id,
          experience_id: id
        });

      if (insertError) {
        console.error('Add bookmark error:', insertError);
        return res.status(500).json({
          success: false,
          message: 'Failed to bookmark experience',
          error: 'Bookmark Failed'
        });
      }

      isBookmarked = true;
    }

    res.json({
      success: true,
      message: isBookmarked ? 'Experience bookmarked successfully' : 'Bookmark removed successfully',
      data: { isBookmarked }
    });

  } catch (error) {
    console.error('Bookmark error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during bookmark operation',
      error: 'Bookmark Failed'
    });
  }
});

module.exports = router;