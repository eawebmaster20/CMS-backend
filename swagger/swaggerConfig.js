
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerOptions = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'My API',
        version: '1.0.0',
        description: 'API for user authentication and movies endpoint',
      },
      servers: [
        {
          url: 'https://entertainment-web-app-backend-2.onrender.com', 
        },
        {
          url: 'http://localhost:5000',
        },
      ],
      components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
            },
          },
        },
        security: [
          {
            bearerAuth: [],
          },
        ],
    },
    apis: ['./swaggerDocs.js'], 
  };
  
  const swaggerDocs = swaggerJsdoc(swaggerOptions);

  function setupSwagger(app) {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
  }
  
  module.exports = setupSwagger;