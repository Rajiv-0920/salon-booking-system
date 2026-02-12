import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Salon Booking System API',
      version: '1.0.0',
      description: '',
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token',
        },
      },
      schemas: {
        RegisterInput: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: {
              type: 'string',
              example: 'Rajiv Kumar',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'rajiv@example.com',
            },
            password: {
              type: 'string',
              format: 'password',
              example: 'StrongPass123',
            },
          },
        },

        LoginInput: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              example: 'rajiv@example.com',
            },
            password: {
              type: 'string',
              example: 'StrongPass123',
            },
          },
        },

        UpdateProfileInput: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              example: 'Updated Name',
            },
            email: {
              type: 'string',
              example: 'updated@example.com',
            },
          },
        },

        PasswordUpdateInput: {
          type: 'object',
          required: ['currentPassword', 'newPassword'],
          properties: {
            currentPassword: {
              type: 'string',
              example: 'OldPassword123',
            },
            newPassword: {
              type: 'string',
              example: 'NewStrongPassword123',
            },
          },
        },
      },
    },
  },
  apis: ['./src/api/routes/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);

const swaggerDocs = (app) => {
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, { swaggerOptions: { withCredentials: true } }),
  );
  console.log('Swagger running at http://localhost:5000/api-docs');
};

export default swaggerDocs;
