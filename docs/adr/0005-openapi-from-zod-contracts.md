# 0005. DTOs and OpenAPI docs from the Zod contracts

Status: accepted

## Context
Every endpoint should be documented and browsable without describing request and response shapes a second time. The shapes already live as Zod 4 schemas in `packages/contracts`. NestJS 12 and `@nestjs/swagger` 12 read Standard Schema (Zod) schemas natively.

## Decision
- A DTO is the Zod schema in `packages/contracts` plus its inferred type (for example `orderRequestSchema` and `OrderRequest`). Handlers take inputs with `@Body/@Param/@Query({ schema })` and return that type. Validation is unchanged: the global `StandardSchemaValidationPipe` and the 400 `{ reason: 'invalid_request', fieldErrors }`.
- No DTO classes and no `@ApiProperty` fields: they would describe a shape twice and drift from the schemas.
- `SwaggerModule.createDocument` with `DocumentBuilder` reflects every route. Request bodies, params and queries come from the `schema` option of the parameter decorators, converted to OpenAPI 3.0.
- Each handler adds what cannot be inferred: `@ApiOperation({ summary })`, `@ApiResponse({ status, description, standardSchema })` for each response (200/201, the 400 on routes with input, the 422 on `POST /order-requests`), and `@ApiHeader` for custom headers such as `Idempotency-Key`.
- Swagger UI is served at `/docs` and the document at `/docs/openapi.json` through `setupDocs` in `apps/api/src/docs/setup-docs.ts`. There is no auth and no environment restriction until phase 3.
- A docs e2e test checks that the document is valid OpenAPI 3, that its routes equal the registered routes, that every operation has a 2xx response with a schema, that every operation with input documents a 400, and that the `Idempotency-Key` header is listed.

## Rejected
- DTO classes from a `createZodDto` helper, or `nestjs-zod`: an extra layer over what the Standard Schema support already does, and `nestjs-zod`'s peers stop at Nest 11.
- class-validator DTOs with `@ApiProperty`: they restate every field.
- `zod-openapi` and `zod-to-openapi`: not needed now that swagger converts Zod itself.
- Our own route registry and spec builder (the first version of this work): it duplicated what `createDocument` already does and could drift from the controllers.

## Consequences
- Response schemas are declared in decorators and can drift from a handler's return type. The test only checks that they exist.
- `@ApiResponse({ standardSchema })` is supported in `@nestjs/swagger` 12.1.2 but is not on the official docs page, so check it on upgrades.
- Custom param decorators such as `@IdempotencyKey()` are not visible to swagger, so their header is documented with `@ApiHeader`.
