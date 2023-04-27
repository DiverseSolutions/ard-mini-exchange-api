# NestJS Backend API
NestJS Backend Template

## Tech Stack
- NodeJS 18.13
- NestJS 9
- Prisma
- MySQL 8
- Docker

## Features
- NestJS Monolithic Application
- NestJS + Prisma Integration
- JWT Authentication / Authorization
- OpenAPI Documentation

## References
- MVC Pattern - https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller
- NestJS Documentation - https://docs.nestjs.com
- Prisma - https://www.prisma.io/docs/getting-started/setup-prisma/start-from-scratch/relational-databases-typescript-mysql
- NestJS CLI - https://docs.nestjs.com/cli/overview
- JWT Token - https://jwt.io/introduction
- NestJS Authentication - https://docs.nestjs.com/security/authentication
- NestJS Swagger (OpenAPI) Documentation - https://docs.nestjs.com/openapi/introduction
- NestJS setup Prisma - https://docs.nestjs.com/recipes/prisma#set-up-prisma
- Generate JWT Secret - openssl rand -base64 12

## Documentation
Run in dev mode and open http://localhost:3000/docs

## Development

  cp .env.dev .env

  docker-compose up

  npx prisma db push

  npx prisma generate

  yarn start:dev

## Sync database to Prisma
  npx prisma db pull

## Production
  yarn build

  yarn start:prod

## How this project was setup?
  nvm use 18

  npm i -g @nestjs/cli

  nest new nest-backend-template

  cd nest-backend-template
  
  yarn add @nestjs/config

  nest g module auth

  nest g controller auth

  nest g service auth

  nest g module users

  nest g service users

  yarn add @nestjs/jwt

and couple more commands and boilerplates