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
      schemas: {},
    },
  },
  apis: ['./src/api/routes/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);

const swaggerDocs = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log('Swagger running at http://localhost:5000/api-docs');
};

export default swaggerDocs;
