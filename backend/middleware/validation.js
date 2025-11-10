const Joi = require('joi');

// Validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      // Log validation errors for debugging
      console.error('=== VALIDATION ERROR ===');
      console.error('Endpoint:', req.method, req.path);
      console.error('Request body:', JSON.stringify(req.body, null, 2));
      console.error('Validation errors:', JSON.stringify(errors, null, 2));
      console.error('========================');

      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    next();
  };
};

// Common validation schemas
const schemas = {
  // User registration validation
  register: Joi.object({
    name: Joi.string()
      .min(2)
      .max(100)
      .required()
      .messages({
        'string.min': 'Name must be at least 2 characters long',
        'string.max': 'Name cannot exceed 100 characters',
        'any.required': 'Name is required'
      }),
    
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),
    
    password: Joi.string()
      .min(8)
      .max(128)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.max': 'Password cannot exceed 128 characters',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'any.required': 'Password is required'
      }),
    
    rollNo: Joi.string()
      .max(50)
      .allow('')
      .optional(),
    
    college: Joi.string()
      .min(2)
      .max(500)
      .required()
      .messages({
        'string.min': 'College name must be at least 2 characters long',
        'string.max': 'College name cannot exceed 500 characters',
        'any.required': 'College is required'
      }),
    
    degree: Joi.string()
      .min(2)
      .max(200)
      .required()
      .messages({
        'string.min': 'Degree must be at least 2 characters long',
        'string.max': 'Degree cannot exceed 200 characters',
        'any.required': 'Degree is required'
      }),
    
    course: Joi.string()
      .min(2)
      .max(200)
      .required()
      .messages({
        'string.min': 'Course must be at least 2 characters long',
        'string.max': 'Course cannot exceed 200 characters',
        'any.required': 'Course is required'
      }),
    
    year: Joi.string()
      .valid('1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', 'Passed Out')
      .required()
      .messages({
        'any.only': 'Year must be one of: 1st Year, 2nd Year, 3rd Year, 4th Year, 5th Year, Passed Out',
        'any.required': 'Year is required'
      })
  }),

  // User login validation
  login: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),
    
    password: Joi.string()
      .required()
      .messages({
        'any.required': 'Password is required'
      })
  }),

  // Profile update validation
  updateProfile: Joi.object({
    name: Joi.string()
      .min(2)
      .max(100)
      .optional(),
    
    rollNo: Joi.string()
      .max(50)
      .allow('')
      .optional(),
    
    college: Joi.string()
      .min(2)
      .max(500)
      .optional(),
    
    degree: Joi.string()
      .min(2)
      .max(200)
      .optional(),
    
    course: Joi.string()
      .min(2)
      .max(200)
      .optional(),
    
    year: Joi.string()
      .valid('1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', 'Passed Out')
      .optional(),
    
    bio: Joi.string()
      .max(500)
      .allow('')
      .optional(),
    
    about: Joi.string()
      .max(2000)
      .allow('')
      .optional(),
    
    skills: Joi.array()
      .items(Joi.string().max(50))
      .max(20)
      .optional(),
    
    githubUrl: Joi.string()
      .allow('')
      .optional(),
    
    linkedinUrl: Joi.string()
      .allow('')
      .optional(),
    
    phone: Joi.string()
      .allow('')
      .optional(),
    
    profilePicture: Joi.string()
      .allow('')
      .optional(),
    
    resumeUrl: Joi.string()
      .allow('')
      .optional()
  }),

  // Experience creation validation - CLEAN VERSION
  createExperience: Joi.object({
    // Required fields
    companyId: Joi.alternatives()
      .try(
        Joi.string().uuid(),
        Joi.string().valid('other')
      )
      .required()
      .messages({
        'any.required': 'Please select a company',
        'alternatives.match': 'Invalid company selection'
      }),
    
    customCompany: Joi.string()
      .min(2)
      .max(200)
      .allow('', null)
      .when('companyId', {
        is: 'other',
        then: Joi.required(),
        otherwise: Joi.optional()
      })
      .messages({
        'string.min': 'Company name must be at least 2 characters',
        'string.max': 'Company name cannot exceed 200 characters',
        'any.required': 'Please enter the company name'
      }),
    
    title: Joi.string()
      .min(5)
      .max(255)
      .required()
      .messages({
        'string.min': 'Title must be at least 5 characters',
        'string.max': 'Title cannot exceed 255 characters',
        'any.required': 'Please enter an experience title'
      }),
    
    role: Joi.string()
      .min(2)
      .max(255)
      .required()
      .messages({
        'string.min': 'Role must be at least 2 characters',
        'string.max': 'Role cannot exceed 255 characters',
        'any.required': 'Please enter the role/position'
      }),
    
    experienceType: Joi.string()
      .valid('Internship', 'Full-Time', 'Apprenticeship')
      .required()
      .messages({
        'any.only': 'Experience type must be Internship, Full-Time, or Apprenticeship',
        'any.required': 'Please select an experience type'
      }),
    
    campusType: Joi.string()
      .valid('On-Campus', 'Off-Campus')
      .required()
      .messages({
        'any.only': 'Campus type must be On-Campus or Off-Campus',
        'any.required': 'Please select campus type'
      }),
    
    result: Joi.string()
      .valid('Selected', 'Not Selected', 'Pending')
      .required()
      .messages({
        'any.only': 'Result must be Selected, Not Selected, or Pending',
        'any.required': 'Please select the result'
      }),
    
    // Optional fields
    interviewDate: Joi.string()
      .allow('', null)
      .optional(),
    
    location: Joi.string()
      .max(255)
      .allow('', null)
      .optional()
      .messages({
        'string.max': 'Location cannot exceed 255 characters'
      }),
    
    overallExperience: Joi.string()
      .max(10000)
      .allow('', null)
      .optional()
      .messages({
        'string.max': 'Overall experience cannot exceed 10000 characters'
      }),
    
    technicalRounds: Joi.string()
      .max(10000)
      .allow('', null)
      .optional()
      .messages({
        'string.max': 'Technical rounds description cannot exceed 10000 characters'
      }),
    
    hrRounds: Joi.string()
      .max(10000)
      .allow('', null)
      .optional()
      .messages({
        'string.max': 'HR rounds description cannot exceed 10000 characters'
      }),
    
    tipsAndAdvice: Joi.string()
      .max(10000)
      .allow('', null)
      .optional()
      .messages({
        'string.max': 'Tips and advice cannot exceed 10000 characters'
      })
  }),

  // Comment creation validation
  createComment: Joi.object({
    content: Joi.string()
      .min(1)
      .max(2000)
      .required()
      .messages({
        'string.min': 'Comment cannot be empty',
        'string.max': 'Comment cannot exceed 2000 characters',
        'any.required': 'Comment content is required'
      }),
    
    parentId: Joi.string()
      .uuid()
      .optional()
  }),

  // Message creation validation
  createMessage: Joi.object({
    content: Joi.string()
      .min(1)
      .max(5000)
      .required()
      .messages({
        'string.min': 'Message cannot be empty',
        'string.max': 'Message cannot exceed 5000 characters',
        'any.required': 'Message content is required'
      }),
    
    messageType: Joi.string()
      .valid('text', 'image', 'file')
      .default('text')
      .optional()
  }),

  // Password change validation
  changePassword: Joi.object({
    currentPassword: Joi.string()
      .required()
      .messages({
        'any.required': 'Current password is required'
      }),
    
    newPassword: Joi.string()
      .min(8)
      .max(128)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
      .required()
      .messages({
        'string.min': 'New password must be at least 8 characters long',
        'string.max': 'New password cannot exceed 128 characters',
        'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'any.required': 'New password is required'
      })
  })
};

module.exports = {
  validate,
  schemas
};