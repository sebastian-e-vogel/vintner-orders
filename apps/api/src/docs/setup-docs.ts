import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

// Called from main.ts and the docs e2e test so both serve the same docs.
export const setupDocs = (app: INestApplication) => {
  const config = new DocumentBuilder()
    .setTitle('Vintner Orders API')
    .setVersion('0.0.1')
    .build();
  SwaggerModule.setup(
    'docs',
    app,
    () => SwaggerModule.createDocument(app, config),
    {
      jsonDocumentUrl: 'docs/openapi.json',
    },
  );
};
