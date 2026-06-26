# Architecture Overview

## System Design

The AI Career Intelligence Platform uses a monorepo structure with pnpm workspaces. The system is designed for AWS deployment with the following components:

### Frontend (apps/client)
- Single Page Application built with React
- Communicates with backend via REST API
- Deployed as static assets served by nginx/CloudFront

### Backend (apps/server)
- RESTful API server with versioned routes
- Handles request validation, logging, and error handling
- Connects to AWS services (DynamoDB, S3, SQS, OpenSearch)

### Infrastructure (infrastructure/cdk)
- DynamoDB: Single-table design with GSIs for flexible access patterns
- S3: Multi-bucket architecture (staging, production, quarantine, analytics, assets)
- SQS: Queues with DLQ for async processing (resume, career, embeddings)
- OpenSearch Serverless: Vector search for career matching

## Data Flow

1. User uploads resume → S3 staging bucket
2. SQS message triggers resume processing
3. AI extracts skills, experience, education
4. Results stored in DynamoDB, embeddings in OpenSearch
5. Career matching uses vector similarity search
6. Learning roadmap generated based on skill gaps

## Local Development

Docker Compose provides local equivalents:
- DynamoDB Local for database
- LocalStack for S3 and SQS
- Direct access for server and client
