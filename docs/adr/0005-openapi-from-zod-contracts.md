# 0005. OpenAPI docs generated from the Zod contracts

Status: accepted

## Context
Every endpoint should be documented and browsable, without describing request and response shapes a second time. The shapes already live as Zod 4 schemas in `packages/contracts`.

## Decision
- Schemas become JSON Schema with Zod's native `z.toJSONSchema` (`target: 'openapi-3.0'`; `io: 'input'` for requests, `'output'` for responses).
- Each module has a `*.docs.ts` file next to its controller. It lists method, path, summary, the request body and headers, and the response schema per status code, importing the schemas from `@vintner/contracts`. `apps/api/src/docs/routes.ts` collects them, and `buildOpenApiDocument` turns them into one OpenAPI 3.0 document.
- `@nestjs/swagger` is used only for `SwaggerModule.setup`, which serves Swagger UI at `/docs` and the document at `/docs/openapi.json`. We hand it our own document; no `@nestjs/swagger` decorators or DTO classes are used.
- A docs e2e test enumerates the controllers' registered routes and fails when a route is missing from the spec (or the spec lists a route that does not exist). `@apidevtools/swagger-parser` checks the document is valid.
- The 400 body (`{ reason: 'invalid_request', fieldErrors }`) is documented on every endpoint that takes input; 422 only where it happens.
- `/docs` is open in every environment until auth arrives in phase 3.

## Rejected
- `@nestjs/swagger` decorators or DTO classes: they describe each shape a second time, and the library does not read Zod.
- `zod-openapi` and `@asteasolutions/zod-to-openapi`: they add a wrapper API for what native conversion and `.meta()` already do.
- Reading routes from `@nestjs/swagger` discovery: it finds paths but not Zod schemas, so a registry would still be needed.

## Consequences
- A registry entry can name the wrong schema for a route; the test catches missing routes, not mismatched shapes.
- DTO classes derived from Zod (a `createZodDto` style helper) are deferred to a possible separate ticket.
