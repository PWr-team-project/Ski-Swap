const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Ski-Swap API',
      version: '1.0.0',
      description: 'API documentation for Ski-Swap - A platform for renting and sharing ski equipment',
      contact: {
        name: 'Ski-Swap Support',
      },
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:5000',
        description: 'API Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token',
        },
      },
      schemas: {
        // User schemas
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'User ID' },
            email: { type: 'string', format: 'email' },
            nickname: { type: 'string' },
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            phone_number: { type: 'string' },
            profile_photo: { type: 'string' },
            background_photo: { type: 'string' },
            user_type: { type: 'string', enum: ['individual', 'company'] },
            oauth_provider: { type: 'string' },
            NIP_number: { type: 'string' },
            website_address: { type: 'string' },
            location: {
              type: 'object',
              properties: {
                country: { type: 'string' },
                state: { type: 'string' },
                city: { type: 'string' },
                street: { type: 'string' },
                street_number: { type: 'string' },
              },
            },
            rating_avg: { type: 'number' },
            response_rate: { type: 'number' },
            response_time: { type: 'number' },
            id_verified: { type: 'boolean' },
            admin_flag: { type: 'boolean' },
          },
        },
        UserRegistration: {
          type: 'object',
          required: ['email', 'password', 'nickname', 'first_name', 'last_name'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 6 },
            nickname: { type: 'string' },
            first_name: { type: 'string' },
            last_name: { type: 'string' },
          },
        },
        UserLogin: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            token: { type: 'string' },
            user: { $ref: '#/components/schemas/User' },
          },
        },

        // Listing schemas
        Listing: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            owner_id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            photos: { type: 'array', items: { type: 'string' } },
            category: { type: 'string' },
            brand: { type: 'string' },
            model: { type: 'string' },
            size: { type: 'string' },
            daily_rate: { type: 'number' },
            weekly_rate: { type: 'number' },
            monthly_rate: { type: 'number' },
            estimated_value: { type: 'number' },
            condition: { type: 'string', enum: ['new', 'like_new', 'good', 'fair', 'poor'] },
            location: {
              type: 'object',
              properties: {
                country: { type: 'string' },
                state: { type: 'string' },
                city: { type: 'string' },
                street: { type: 'string' },
                street_number: { type: 'string' },
                latitude: { type: 'number' },
                longitude: { type: 'number' },
              },
            },
            available: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        ListingCreate: {
          type: 'object',
          required: ['title', 'description', 'category', 'dailyRate', 'condition', 'city', 'country', 'latitude', 'longitude'],
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            category: { type: 'string' },
            brand: { type: 'string' },
            model: { type: 'string' },
            size: { type: 'string' },
            dailyRate: { type: 'number' },
            weeklyRate: { type: 'number' },
            monthlyRate: { type: 'number' },
            estimatedValue: { type: 'number' },
            condition: { type: 'string', enum: ['new', 'like_new', 'good', 'fair', 'poor'] },
            city: { type: 'string' },
            state: { type: 'string' },
            country: { type: 'string' },
            street: { type: 'string' },
            streetNumber: { type: 'string' },
            latitude: { type: 'number' },
            longitude: { type: 'number' },
          },
        },

        // Booking schemas
        Booking: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            renter_id: { type: 'string' },
            listing_id: { type: 'string' },
            start_date: { type: 'string', format: 'date' },
            end_date: { type: 'string', format: 'date' },
            insurance_flag: { type: 'boolean' },
            total_price: { type: 'number' },
            status: { $ref: '#/components/schemas/BookingStatus' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        BookingCreate: {
          type: 'object',
          required: ['listing_id', 'start_date', 'end_date', 'total_price'],
          properties: {
            listing_id: { type: 'string' },
            start_date: { type: 'string', format: 'date' },
            end_date: { type: 'string', format: 'date' },
            insurance_flag: { type: 'boolean', default: false },
            total_price: { type: 'number' },
          },
        },
        BookingStatus: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            booking_id: { type: 'string' },
            status: {
              type: 'string',
              enum: ['PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED', 'PICKUP', 'PICKUP_OWNER', 'PICKUP_RENTER', 'IN_PROGRESS', 'RETURN', 'RETURN_OWNER', 'RETURN_RENTER', 'COMPLETED', 'REVIEWED', 'DISPUTED', 'DISPUTE_RESOLVED'],
            },
            changed_by: { type: 'string', enum: ['renter', 'owner', 'system'] },
            changed_by_user_id: { type: 'string' },
            notes: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },

        // Message schemas
        Message: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            sender: { $ref: '#/components/schemas/User' },
            content: { type: 'string' },
            messageType: { type: 'string', enum: ['text', 'listing_inquiry'] },
            image: { type: 'string' },
            listing: { $ref: '#/components/schemas/Listing' },
            createdAt: { type: 'string', format: 'date-time' },
            read: { type: 'boolean' },
          },
        },
        Conversation: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            otherUser: { $ref: '#/components/schemas/User' },
            lastMessage: { $ref: '#/components/schemas/Message' },
            lastMessageTime: { type: 'string', format: 'date-time' },
            unreadCount: { type: 'integer' },
          },
        },

        // Location schema
        Location: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            country: { type: 'string' },
            state: { type: 'string' },
            city: { type: 'string' },
            street: { type: 'string' },
            street_number: { type: 'string' },
            latitude: { type: 'number' },
            longitude: { type: 'number' },
          },
        },

        // Category schema
        Category: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
          },
        },

        // Review schema
        Review: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            booking_id: { type: 'string' },
            reviewer_id: { type: 'string' },
            renter_id: { type: 'string' },
            owner_id: { type: 'string' },
            review_type: { type: 'string', enum: ['renter_to_owner', 'owner_to_renter'] },
            rating: { type: 'number', minimum: 1, maximum: 5 },
            comment: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },

        // BookingPhoto schema
        BookingPhoto: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            booking_id: { type: 'string' },
            uploaded_by: { type: 'string' },
            type: { type: 'string', enum: ['pickup', 'return', 'dispute'] },
            url: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },

        // Error response
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            error: { type: 'string' },
          },
        },
      },
    },
    tags: [
      { name: 'Authentication', description: 'User authentication and registration' },
      { name: 'Google OAuth', description: 'Google OAuth 2.0 authentication' },
      { name: 'Password Reset', description: 'Password reset functionality' },
      { name: 'Users', description: 'User profile management' },
      { name: 'Listings', description: 'Equipment listing management' },
      { name: 'Bookings', description: 'Booking management' },
      { name: 'Booking Status', description: 'Booking state transitions and actions' },
      { name: 'Booking Photos', description: 'Booking photo uploads for pickup/return/dispute' },
      { name: 'Booking Messages', description: 'Booking-specific chat messages' },
      { name: 'Reviews', description: 'User and booking reviews' },
      { name: 'Messages', description: 'Messaging and conversations' },
      { name: 'Verification', description: 'ID verification requests and admin management' },
      { name: 'Admin', description: 'Admin-only user management endpoints' },
      { name: 'Locations', description: 'Location management' },
    ],
    paths: {
      // Health check
      '/': {
        get: {
          summary: 'Health check',
          description: 'Check if the API is running',
          responses: {
            200: {
              description: 'API is running',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string', example: 'Backend API is running!' },
                    },
                  },
                },
              },
            },
          },
        },
      },

      // Authentication routes
      '/api/auth/register': {
        post: {
          tags: ['Authentication'],
          summary: 'Register a new user',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UserRegistration' },
              },
            },
          },
          responses: {
            201: {
              description: 'User registered successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AuthResponse' },
                },
              },
            },
            400: {
              description: 'Validation error or user already exists',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/auth/login': {
        post: {
          tags: ['Authentication'],
          summary: 'Login user',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UserLogin' },
              },
            },
          },
          responses: {
            200: {
              description: 'Login successful',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AuthResponse' },
                },
              },
            },
            400: {
              description: 'Invalid credentials',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/auth/verify': {
        get: {
          tags: ['Authentication'],
          summary: 'Verify JWT token',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Token is valid',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      authenticated: { type: 'boolean' },
                      user: { $ref: '#/components/schemas/User' },
                    },
                  },
                },
              },
            },
            401: {
              description: 'Invalid or expired token',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },

      // Password Reset routes
      '/api/password/forgot-password': {
        post: {
          tags: ['Password Reset'],
          summary: 'Request password reset',
          description: 'Send a 6-digit reset code to user email',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email'],
                  properties: {
                    email: { type: 'string', format: 'email' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Reset code sent to email',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                    },
                  },
                },
              },
            },
            400: {
              description: 'User not found or OAuth user',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/password/verify-reset-code': {
        post: {
          tags: ['Password Reset'],
          summary: 'Verify reset code',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'code'],
                  properties: {
                    email: { type: 'string', format: 'email' },
                    code: { type: 'string', description: '6-digit reset code' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Code is valid',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                    },
                  },
                },
              },
            },
            400: {
              description: 'Invalid or expired code',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/password/reset-password': {
        post: {
          tags: ['Password Reset'],
          summary: 'Reset password',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'code', 'newPassword'],
                  properties: {
                    email: { type: 'string', format: 'email' },
                    code: { type: 'string', description: '6-digit reset code' },
                    newPassword: { type: 'string', minLength: 6 },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Password reset successful',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                    },
                  },
                },
              },
            },
            400: {
              description: 'Invalid code or validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },

      // Google OAuth routes
      '/api/auth/google': {
        get: {
          tags: ['Google OAuth'],
          summary: 'Initiate Google OAuth',
          description: 'Redirects to Google login page',
          responses: {
            302: {
              description: 'Redirect to Google OAuth',
            },
          },
        },
      },
      '/api/auth/google/callback': {
        get: {
          tags: ['Google OAuth'],
          summary: 'Google OAuth callback',
          description: 'Callback URL for Google OAuth. Redirects to client with token.',
          parameters: [
            {
              name: 'code',
              in: 'query',
              description: 'Authorization code from Google',
              schema: { type: 'string' },
            },
          ],
          responses: {
            302: {
              description: 'Redirect to client with token',
            },
          },
        },
      },
      '/api/auth/google/verify': {
        get: {
          tags: ['Google OAuth'],
          summary: 'Verify Google OAuth token',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Token is valid',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      authenticated: { type: 'boolean' },
                      user: { $ref: '#/components/schemas/User' },
                    },
                  },
                },
              },
            },
          },
        },
      },

      // User routes
      '/api/users/profile': {
        get: {
          tags: ['Users'],
          summary: 'Get current user profile',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'User profile',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      user: { $ref: '#/components/schemas/User' },
                    },
                  },
                },
              },
            },
            401: {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
        put: {
          tags: ['Users'],
          summary: 'Update user profile',
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    first_name: { type: 'string' },
                    last_name: { type: 'string' },
                    phone_number: { type: 'string' },
                    location_country: { type: 'string' },
                    location_state: { type: 'string' },
                    location_city: { type: 'string' },
                    location_street: { type: 'string' },
                    location_street_number: { type: 'string' },
                    upgrade_to_company: { type: 'boolean' },
                    NIP_number: { type: 'string' },
                    website_address: { type: 'string' },
                    remove_profile_photo: { type: 'boolean' },
                    remove_background_photo: { type: 'boolean' },
                    profile_photo: { type: 'string', format: 'binary' },
                    background_photo: { type: 'string', format: 'binary' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Profile updated',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      user: { $ref: '#/components/schemas/User' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/users/change-password': {
        put: {
          tags: ['Users'],
          summary: 'Change user password',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['currentPassword', 'newPassword'],
                  properties: {
                    currentPassword: { type: 'string' },
                    newPassword: { type: 'string', minLength: 6 },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Password changed',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/users/account': {
        delete: {
          tags: ['Users'],
          summary: 'Delete user account',
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    password: { type: 'string', description: 'Required for non-OAuth users' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Account deleted',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/users/public/{identifier}': {
        get: {
          tags: ['Users'],
          summary: 'Get public user profile',
          parameters: [
            {
              name: 'identifier',
              in: 'path',
              required: true,
              description: 'User ID or nickname',
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: {
              description: 'Public user profile',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      user: { $ref: '#/components/schemas/User' },
                      statistics: {
                        type: 'object',
                        properties: {
                          rentalsFromOthers: { type: 'integer' },
                          rentalsToOthers: { type: 'integer' },
                          activeListingsCount: { type: 'integer' },
                        },
                      },
                      reviews: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Review' },
                      },
                      activeListings: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Listing' },
                      },
                    },
                  },
                },
              },
            },
            404: {
              description: 'User not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/users/search': {
        get: {
          tags: ['Users'],
          summary: 'Search users (public)',
          description: 'Search users by nickname, first name, or last name',
          parameters: [
            {
              name: 'query',
              in: 'query',
              required: true,
              description: 'Search query',
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: {
              description: 'Search results',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      users: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/User' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },

      // Location routes
      '/api/locations/{id}': {
        get: {
          tags: ['Locations'],
          summary: 'Get location by ID',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Location ID',
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: {
              description: 'Location details',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Location' },
                },
              },
            },
            404: {
              description: 'Location not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },

      // Listing routes
      '/api/listings/categories': {
        get: {
          tags: ['Listings'],
          summary: 'Get all categories',
          responses: {
            200: {
              description: 'List of categories',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      categories: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Category' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/listings/create': {
        post: {
          tags: ['Listings'],
          summary: 'Create a new listing',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['title', 'description', 'category', 'dailyRate', 'condition', 'city', 'country', 'latitude', 'longitude'],
                  properties: {
                    title: { type: 'string' },
                    description: { type: 'string' },
                    category: { type: 'string' },
                    brand: { type: 'string' },
                    model: { type: 'string' },
                    size: { type: 'string' },
                    dailyRate: { type: 'number' },
                    weeklyRate: { type: 'number' },
                    monthlyRate: { type: 'number' },
                    estimatedValue: { type: 'number' },
                    condition: { type: 'string', enum: ['new', 'like_new', 'good', 'fair', 'poor'] },
                    city: { type: 'string' },
                    state: { type: 'string' },
                    country: { type: 'string' },
                    street: { type: 'string' },
                    streetNumber: { type: 'string' },
                    latitude: { type: 'number' },
                    longitude: { type: 'number' },
                    photos: {
                      type: 'array',
                      items: { type: 'string', format: 'binary' },
                      maxItems: 10,
                    },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Listing created',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      listing: { $ref: '#/components/schemas/Listing' },
                    },
                  },
                },
              },
            },
            400: {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/listings/my/listings': {
        get: {
          tags: ['Listings'],
          summary: 'Get current user listings',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'User listings',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      listings: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Listing' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/listings': {
        get: {
          tags: ['Listings'],
          summary: 'Get all available listings',
          responses: {
            200: {
              description: 'All available listings',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      listings: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Listing' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/listings/{id}': {
        get: {
          tags: ['Listings'],
          summary: 'Get listing by ID',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Listing ID',
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: {
              description: 'Listing details',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      listing: { $ref: '#/components/schemas/Listing' },
                    },
                  },
                },
              },
            },
            404: {
              description: 'Listing not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
        put: {
          tags: ['Listings'],
          summary: 'Update listing',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Listing ID',
              schema: { type: 'string' },
            },
          ],
          requestBody: {
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    description: { type: 'string' },
                    category: { type: 'string' },
                    brand: { type: 'string' },
                    model: { type: 'string' },
                    size: { type: 'string' },
                    dailyRate: { type: 'number' },
                    weeklyRate: { type: 'number' },
                    monthlyRate: { type: 'number' },
                    estimatedValue: { type: 'number' },
                    condition: { type: 'string' },
                    available: { type: 'boolean' },
                    photos: {
                      type: 'array',
                      items: { type: 'string', format: 'binary' },
                      maxItems: 10,
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Listing updated',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      listing: { $ref: '#/components/schemas/Listing' },
                    },
                  },
                },
              },
            },
          },
        },
        delete: {
          tags: ['Listings'],
          summary: 'Delete listing',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Listing ID',
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: {
              description: 'Listing deleted',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/listings/{id}/availability': {
        put: {
          tags: ['Listings'],
          summary: 'Toggle listing availability',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Listing ID',
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: {
              description: 'Availability toggled',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      available: { type: 'boolean' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/listings/{id}/blocked-dates': {
        get: {
          tags: ['Listings'],
          summary: 'Get blocked dates for listing',
          description: 'Returns dates that are unavailable due to existing bookings',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Listing ID',
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: {
              description: 'Blocked dates',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      blockedDates: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            start_date: { type: 'string', format: 'date' },
                            end_date: { type: 'string', format: 'date' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },

      // Message routes
      '/api/messages/conversations': {
        get: {
          tags: ['Messages'],
          summary: 'Get all conversations',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'List of conversations',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      conversations: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Conversation' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/messages/conversation/{conversationId}': {
        get: {
          tags: ['Messages'],
          summary: 'Get messages in conversation',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'conversationId',
              in: 'path',
              required: true,
              description: 'Conversation ID',
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: {
              description: 'Conversation messages',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      messages: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Message' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/messages/send': {
        post: {
          tags: ['Messages'],
          summary: 'Send a message',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    conversationId: { type: 'string' },
                    receiverId: { type: 'string' },
                    content: { type: 'string' },
                    image: { type: 'string', format: 'binary' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Message sent',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { $ref: '#/components/schemas/Message' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/messages/start-conversation': {
        post: {
          tags: ['Messages'],
          summary: 'Start new conversation',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['receiverId'],
                  properties: {
                    receiverId: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Conversation started',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      conversation: { $ref: '#/components/schemas/Conversation' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/messages/start-listing-conversation': {
        post: {
          tags: ['Messages'],
          summary: 'Start conversation about listing',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['listingId', 'sellerId'],
                  properties: {
                    listingId: { type: 'string' },
                    sellerId: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Conversation started with listing context',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      conversation: { $ref: '#/components/schemas/Conversation' },
                      message: { $ref: '#/components/schemas/Message' },
                    },
                  },
                },
              },
            },
          },
        },
      },

      // Booking routes
      '/api/bookings/renting': {
        get: {
          tags: ['Bookings'],
          summary: 'Get user rentals (as renter)',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'User rentals',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      stats: {
                        type: 'object',
                        properties: {
                          pendingRequests: { type: 'integer' },
                          activeRentals: { type: 'integer' },
                          upcomingRentals: { type: 'integer' },
                          completedRentals: { type: 'integer' },
                        },
                      },
                      bookings: {
                        type: 'object',
                        properties: {
                          pending: { type: 'array', items: { $ref: '#/components/schemas/Booking' } },
                          active: { type: 'array', items: { $ref: '#/components/schemas/Booking' } },
                          upcoming: { type: 'array', items: { $ref: '#/components/schemas/Booking' } },
                          history: { type: 'array', items: { $ref: '#/components/schemas/Booking' } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/bookings/lending': {
        get: {
          tags: ['Bookings'],
          summary: 'Get user bookings (as owner)',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'User bookings as owner',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      stats: {
                        type: 'object',
                        properties: {
                          pendingRequests: { type: 'integer' },
                          activeBookings: { type: 'integer' },
                          upcomingBookings: { type: 'integer' },
                          completedBookings: { type: 'integer' },
                          totalEarnings: { type: 'number' },
                          averageRating: { type: 'number' },
                        },
                      },
                      bookings: {
                        type: 'object',
                        properties: {
                          active: { type: 'array', items: { $ref: '#/components/schemas/Booking' } },
                          upcoming: { type: 'array', items: { $ref: '#/components/schemas/Booking' } },
                          pending: { type: 'array', items: { $ref: '#/components/schemas/Booking' } },
                          history: { type: 'array', items: { $ref: '#/components/schemas/Booking' } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/bookings/create': {
        post: {
          tags: ['Bookings'],
          summary: 'Create a new booking',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/BookingCreate' },
              },
            },
          },
          responses: {
            201: {
              description: 'Booking created',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      booking: { $ref: '#/components/schemas/Booking' },
                      status: { $ref: '#/components/schemas/BookingStatus' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/bookings/{id}': {
        get: {
          tags: ['Bookings'],
          summary: 'Get booking by ID',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Booking ID',
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: {
              description: 'Booking details',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Booking' },
                },
              },
            },
          },
        },
        put: {
          tags: ['Bookings'],
          summary: 'Update booking',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Booking ID',
              schema: { type: 'string' },
            },
          ],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    start_date: { type: 'string', format: 'date' },
                    end_date: { type: 'string', format: 'date' },
                    insurance_flag: { type: 'boolean' },
                    total_price: { type: 'number' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Booking updated',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      booking: { $ref: '#/components/schemas/Booking' },
                    },
                  },
                },
              },
            },
          },
        },
        delete: {
          tags: ['Bookings'],
          summary: 'Delete booking',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Booking ID',
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: {
              description: 'Booking deleted',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/bookings/{id}/payment/process': {
        post: {
          tags: ['Bookings'],
          summary: 'Process booking payment',
          description: 'Confirm payment for booking',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Booking ID',
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: {
              description: 'Payment processed',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      booking: { $ref: '#/components/schemas/Booking' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/bookings/{id}/payment/reject': {
        post: {
          tags: ['Bookings'],
          summary: 'Reject booking payment',
          description: 'Mark payment as failed or rejected',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Booking ID',
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: {
              description: 'Payment rejected',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      booking: { $ref: '#/components/schemas/Booking' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/bookings/{id}/confirmation': {
        get: {
          tags: ['Bookings'],
          summary: 'Get booking confirmation data',
          description: 'Retrieve booking confirmation details for display',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Booking ID',
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: {
              description: 'Booking confirmation data',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Booking' },
                },
              },
            },
          },
        },
      },
      '/api/bookings/{id}/status': {
        put: {
          tags: ['Bookings'],
          summary: 'Update booking status (deprecated - use /status/transition or action endpoints instead)',
          deprecated: true,
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Booking ID',
              schema: { type: 'string' },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['status'],
                  properties: {
                    status: {
                      type: 'string',
                      enum: ['PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED', 'PICKUP', 'PICKUP_OWNER', 'PICKUP_RENTER', 'IN_PROGRESS', 'RETURN', 'RETURN_OWNER', 'RETURN_RENTER', 'COMPLETED', 'REVIEWED', 'DISPUTED', 'DISPUTE_RESOLVED'],
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Status updated',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      status: { $ref: '#/components/schemas/BookingStatus' },
                    },
                  },
                },
              },
            },
          },
        },
      },

      // Booking state routes
      '/api/bookings/{id}/status/current': {
        get: {
          tags: ['Booking Status'],
          summary: 'Get current booking status',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Booking ID',
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: {
              description: 'Current booking status',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      bookingId: { type: 'string' },
                      currentStatus: { type: 'string' },
                      userType: { type: 'string' },
                      requirements: { type: 'object' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/bookings/{id}/status/history': {
        get: {
          tags: ['Booking Status'],
          summary: 'Get booking status history',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Booking ID',
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: {
              description: 'Status history',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      bookingId: { type: 'string' },
                      history: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/BookingStatus' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/bookings/{id}/status/transition': {
        post: {
          tags: ['Booking Status'],
          summary: 'Transition to new status',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Booking ID',
              schema: { type: 'string' },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['newStatus'],
                  properties: {
                    newStatus: { type: 'string' },
                    notes: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Status transitioned',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      previousStatus: { type: 'string' },
                      newStatus: { type: 'string' },
                      statusEntry: { $ref: '#/components/schemas/BookingStatus' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/bookings/{id}/actions/accept': {
        post: {
          tags: ['Booking Status'],
          summary: 'Accept booking (owner only)',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Booking ID',
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: {
              description: 'Booking accepted',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      statusEntry: { $ref: '#/components/schemas/BookingStatus' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/bookings/{id}/actions/decline': {
        post: {
          tags: ['Booking Status'],
          summary: 'Decline booking (owner only)',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Booking ID',
              schema: { type: 'string' },
            },
          ],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    reason: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Booking declined',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      statusEntry: { $ref: '#/components/schemas/BookingStatus' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/bookings/{id}/actions/cancel': {
        post: {
          tags: ['Booking Status'],
          summary: 'Cancel booking',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Booking ID',
              schema: { type: 'string' },
            },
          ],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    reason: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Booking cancelled',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      statusEntry: { $ref: '#/components/schemas/BookingStatus' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/bookings/{id}/actions/confirm-pickup': {
        post: {
          tags: ['Booking Status'],
          summary: 'Confirm pickup (renter only)',
          description: 'Renter confirms equipment pickup. PICKUP -> PICKUP_RENTER (renter confirms first) or PICKUP_OWNER -> IN_PROGRESS (renter confirms after owner). Requires photos to be uploaded first.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Booking ID',
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: {
              description: 'Pickup confirmed',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      statusEntry: { $ref: '#/components/schemas/BookingStatus' },
                    },
                  },
                },
              },
            },
            400: {
              description: 'Invalid state transition',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/bookings/{id}/actions/confirm-return': {
        post: {
          tags: ['Booking Status'],
          summary: 'Confirm return (renter only)',
          description: 'Renter confirms equipment return (RETURN -> RETURN_RENTER)',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Booking ID',
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: {
              description: 'Return confirmed',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      statusEntry: { $ref: '#/components/schemas/BookingStatus' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/bookings/{id}/actions/owner-confirm-handoff': {
        post: {
          tags: ['Booking Status'],
          summary: 'Confirm equipment handoff (owner only)',
          description: 'Owner confirms giving equipment to renter. PICKUP -> PICKUP_OWNER (owner confirms first) or PICKUP_RENTER -> IN_PROGRESS (owner confirms after renter)',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Booking ID',
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: {
              description: 'Handoff confirmed',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      statusEntry: { $ref: '#/components/schemas/BookingStatus' },
                    },
                  },
                },
              },
            },
            400: {
              description: 'Invalid state transition',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            403: {
              description: 'Not authorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/bookings/{id}/actions/owner-confirm-return': {
        post: {
          tags: ['Booking Status'],
          summary: 'Confirm receiving equipment back (owner only)',
          description: 'Owner confirms receiving equipment back from renter (RETURN -> RETURN_OWNER). Owner must then verify equipment condition.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Booking ID',
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: {
              description: 'Return confirmed',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      statusEntry: { $ref: '#/components/schemas/BookingStatus' },
                    },
                  },
                },
              },
            },
            400: {
              description: 'Invalid state transition',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            403: {
              description: 'Not authorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/bookings/{id}/actions/verify-complete': {
        post: {
          tags: ['Booking Status'],
          summary: 'Verify equipment returned (owner only)',
          description: 'Owner verifies equipment is returned in good condition. RETURN_OWNER -> COMPLETED or RETURN_RENTER -> COMPLETED. This marks the booking as successfully completed.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Booking ID',
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: {
              description: 'Verification complete',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      statusEntry: { $ref: '#/components/schemas/BookingStatus' },
                    },
                  },
                },
              },
            },
            400: {
              description: 'Invalid state transition',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/bookings/{id}/actions/dispute': {
        post: {
          tags: ['Booking Status'],
          summary: 'Open dispute (owner only)',
          description: 'Owner opens a dispute about equipment condition or damage. RETURN_OWNER -> DISPUTED or RETURN_RENTER -> DISPUTED. Support team will be notified.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Booking ID',
              schema: { type: 'string' },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['reason'],
                  properties: {
                    reason: { type: 'string', description: 'Detailed reason for the dispute' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Dispute opened',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      statusEntry: { $ref: '#/components/schemas/BookingStatus' },
                    },
                  },
                },
              },
            },
            400: {
              description: 'Invalid state transition or missing reason',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/bookings/{id}/actions/mark-reviewed': {
        post: {
          tags: ['Booking Status'],
          summary: 'Mark as reviewed',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Booking ID',
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: {
              description: 'Marked as reviewed',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      statusEntry: { $ref: '#/components/schemas/BookingStatus' },
                    },
                  },
                },
              },
            },
          },
        },
      },

      // Booking photo routes
      '/api/bookings/{id}/photos/upload': {
        post: {
          tags: ['Booking Photos'],
          summary: 'Upload booking photos',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Booking ID',
              schema: { type: 'string' },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['type'],
                  properties: {
                    type: { type: 'string', enum: ['pickup', 'return', 'dispute'] },
                    photos: {
                      type: 'array',
                      items: { type: 'string', format: 'binary' },
                      maxItems: 10,
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Photos uploaded',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      photos: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/BookingPhoto' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/bookings/{id}/photos': {
        get: {
          tags: ['Booking Photos'],
          summary: 'Get booking photos',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Booking ID',
              schema: { type: 'string' },
            },
            {
              name: 'type',
              in: 'query',
              description: 'Filter by photo type',
              schema: { type: 'string', enum: ['pickup', 'return', 'dispute'] },
            },
          ],
          responses: {
            200: {
              description: 'Booking photos',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      bookingId: { type: 'string' },
                      photos: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/BookingPhoto' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/bookings/{id}/photos/{photoId}': {
        delete: {
          tags: ['Booking Photos'],
          summary: 'Delete booking photo',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Booking ID',
              schema: { type: 'string' },
            },
            {
              name: 'photoId',
              in: 'path',
              required: true,
              description: 'Photo ID',
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: {
              description: 'Photo deleted',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },

      // Review routes
      '/api/reviews/bookings/{bookingId}/reviews': {
        get: {
          tags: ['Reviews'],
          summary: 'Get reviews for booking',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'bookingId',
              in: 'path',
              required: true,
              description: 'Booking ID',
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: {
              description: 'Booking reviews',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      reviews: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Review' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['Reviews'],
          summary: 'Submit review for booking',
          description: 'Renter submits review for completed booking',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'bookingId',
              in: 'path',
              required: true,
              description: 'Booking ID',
              schema: { type: 'string' },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['rating', 'comment'],
                  properties: {
                    rating: { type: 'number', minimum: 1, maximum: 5 },
                    comment: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Review submitted',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      review: { $ref: '#/components/schemas/Review' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/reviews/users/{userId}/reviews': {
        get: {
          tags: ['Reviews'],
          summary: 'Get all reviews for user (public)',
          parameters: [
            {
              name: 'userId',
              in: 'path',
              required: true,
              description: 'User ID',
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: {
              description: 'User reviews',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      reviews: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Review' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },

      // Booking Messages routes
      '/api/bookings/{bookingId}/messages': {
        get: {
          tags: ['Booking Messages'],
          summary: 'Get booking chat messages',
          description: 'Get all messages in booking-specific chat (available after booking acceptance)',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'bookingId',
              in: 'path',
              required: true,
              description: 'Booking ID',
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: {
              description: 'Booking messages',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      messages: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Message' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['Booking Messages'],
          summary: 'Send booking chat message',
          description: 'Send message in booking chat with optional image attachment',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'bookingId',
              in: 'path',
              required: true,
              description: 'Booking ID',
              schema: { type: 'string' },
            },
          ],
          requestBody: {
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    image: { type: 'string', format: 'binary' },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Message sent',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { $ref: '#/components/schemas/Message' },
                    },
                  },
                },
              },
            },
          },
        },
      },

      // Verification routes
      '/api/verification/submit': {
        post: {
          tags: ['Verification'],
          summary: 'Submit ID verification request',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['firstName', 'lastName', 'dateOfBirth', 'nationality', 'idNumber', 'idDocument'],
                  properties: {
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    dateOfBirth: { type: 'string', format: 'date' },
                    nationality: { type: 'string' },
                    idNumber: { type: 'string' },
                    idDocument: { type: 'string', format: 'binary', description: '5MB limit, JPEG/PNG/PDF' },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Verification request submitted',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      verificationRequest: {
                        type: 'object',
                        properties: {
                          _id: { type: 'string' },
                          status: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/verification/my-request': {
        get: {
          tags: ['Verification'],
          summary: 'Get user verification request status',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Verification request status',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      request: {
                        type: 'object',
                        properties: {
                          _id: { type: 'string' },
                          status: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
                          submittedAt: { type: 'string', format: 'date-time' },
                          rejectionReason: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/verification/admin/requests': {
        get: {
          tags: ['Verification'],
          summary: 'Get all verification requests (admin)',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'status',
              in: 'query',
              description: 'Filter by status',
              schema: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
            },
          ],
          responses: {
            200: {
              description: 'Verification requests',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      requests: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            _id: { type: 'string' },
                            user: { $ref: '#/components/schemas/User' },
                            status: { type: 'string' },
                            submittedAt: { type: 'string', format: 'date-time' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/verification/admin/requests/{id}': {
        get: {
          tags: ['Verification'],
          summary: 'Get verification request details (admin)',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Verification request ID',
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: {
              description: 'Verification request details',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      request: {
                        type: 'object',
                        properties: {
                          _id: { type: 'string' },
                          user: { $ref: '#/components/schemas/User' },
                          firstName: { type: 'string' },
                          lastName: { type: 'string' },
                          dateOfBirth: { type: 'string' },
                          nationality: { type: 'string' },
                          idNumber: { type: 'string' },
                          idDocumentPath: { type: 'string' },
                          status: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/verification/admin/requests/{id}/approve': {
        post: {
          tags: ['Verification'],
          summary: 'Approve verification request (admin)',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Verification request ID',
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: {
              description: 'Request approved',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/verification/admin/requests/{id}/reject': {
        post: {
          tags: ['Verification'],
          summary: 'Reject verification request (admin)',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Verification request ID',
              schema: { type: 'string' },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['reason'],
                  properties: {
                    reason: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Request rejected',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },

      // Admin routes
      '/api/admin/users': {
        get: {
          tags: ['Admin'],
          summary: 'Get all users with filters (admin)',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'search',
              in: 'query',
              description: 'Search by email, nickname, or name',
              schema: { type: 'string' },
            },
            {
              name: 'verified',
              in: 'query',
              description: 'Filter by verification status',
              schema: { type: 'boolean' },
            },
            {
              name: 'blocked',
              in: 'query',
              description: 'Filter by blocked status',
              schema: { type: 'boolean' },
            },
            {
              name: 'userType',
              in: 'query',
              description: 'Filter by user type',
              schema: { type: 'string', enum: ['individual', 'company'] },
            },
            {
              name: 'page',
              in: 'query',
              description: 'Page number for pagination',
              schema: { type: 'integer', default: 1 },
            },
            {
              name: 'limit',
              in: 'query',
              description: 'Items per page',
              schema: { type: 'integer', default: 20 },
            },
            {
              name: 'sortBy',
              in: 'query',
              description: 'Sort field',
              schema: { type: 'string', default: 'createdAt' },
            },
            {
              name: 'order',
              in: 'query',
              description: 'Sort order',
              schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
            },
          ],
          responses: {
            200: {
              description: 'Users list',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      users: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/User' },
                      },
                      pagination: {
                        type: 'object',
                        properties: {
                          total: { type: 'integer' },
                          page: { type: 'integer' },
                          pages: { type: 'integer' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/admin/users/{id}': {
        get: {
          tags: ['Admin'],
          summary: 'Get user details (admin)',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'User ID',
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: {
              description: 'User details',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      user: { $ref: '#/components/schemas/User' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/admin/users/{id}/stats': {
        get: {
          tags: ['Admin'],
          summary: 'Get user statistics (admin)',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'User ID',
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: {
              description: 'User statistics',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      listings: { type: 'integer' },
                      bookingsAsRenter: { type: 'integer' },
                      bookingsAsOwner: { type: 'integer' },
                      totalEarnings: { type: 'number' },
                      averageRating: { type: 'number' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: [], // We define everything inline above
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
