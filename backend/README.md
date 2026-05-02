# Five-A-Side Manager - Backend

A Node.js/Express backend for managing 5-a-side football matches, players, and team management.

## Features

- **User Authentication**: JWT-based auth with refresh tokens
- **Match Management**: Create, view, and manage matches
- **Player Management**: Add players and track statistics
- **Team Balancing**: Automatic team balancing algorithm
- **Admin Dashboard**: Manage users and view feedback
- **Feedback System**: User feedback collection
- **Rate Limiting**: API protection against abuse
- **MongoDB Integration**: Secure database operations

## Tech Stack

- Node.js & Express 5.x
- MongoDB & Mongoose
- JWT for authentication
- Helmet for security
- CORS for cross-origin requests
- Express Rate Limiter

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (free tier)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/five-a-side-manager-backend.git
   cd five-a-side-manager-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your values:
   - `MONGO_URI`: MongoDB Atlas connection string
   - `JWT_SECRET`: Random secret key
   - `REFRESH_TOKEN_SECRET`: Random refresh token secret
   - `FRONTEND_URL`: Your frontend URL

4. Run the server:
   ```bash
   npm start
   ```

   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password/:token` - Reset password

### Players
- `GET /api/players` - Get all players
- `POST /api/players` - Create new player
- `PUT /api/players/:id` - Update player
- `DELETE /api/players/:id` - Delete player

### Matches
- `GET /api/matches` - Get all matches
- `POST /api/matches` - Create match
- `GET /api/matches/:id` - Get match details
- `PUT /api/matches/:id` - Update match
- `DELETE /api/matches/:id` - Delete match
- `POST /api/matches/:id/balance` - Auto-balance teams

### Admin
- `GET /api/admin/stats` - Get statistics
- `GET /api/admin/users` - List all users
- `GET /api/admin/feedback` - View feedback

## Deployment

See [DEPLOYMENT_STEPS.md](../DEPLOYMENT_STEPS.md) for complete deployment instructions to Railway.

### Quick Deploy to Railway

1. Push code to GitHub
2. Go to Railway.app
3. Connect GitHub repository
4. Set environment variables
5. Deploy!

## Error Handling

The API uses standard HTTP status codes and returns errors in this format:
```json
{
  "error": "Error message",
  "status": 400
}
```

## Security Features

- Helmet.js for HTTP headers
- CORS validation
- JWT token authentication
- Rate limiting on API routes
- Password hashing with bcryptjs
- MongoDB connection string encryption

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Push to your fork
5. Submit a pull request

## License

ISC
