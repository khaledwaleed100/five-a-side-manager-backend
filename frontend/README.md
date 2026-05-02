# Five-A-Side Manager - Frontend

An Angular 17 PWA (Progressive Web App) for managing 5-a-side football matches and teams.

## Features

- **Progressive Web App**: Install on home screen, works offline
- **Responsive Design**: Mobile-first with Tailwind CSS
- **Dark Mode**: System preference detection
- **Real-time Updates**: WebSocket support for live match updates
- **User Authentication**: Secure JWT-based auth
- **Match Management**: Create and join matches
- **Team Management**: View and manage players
- **Admin Dashboard**: Statistics and user management
- **Feedback System**: In-app feedback submission
- **Offline Support**: IndexedDB for offline data persistence

## Tech Stack

- Angular 17
- TypeScript 5.4
- Tailwind CSS 3.4
- RxJS for reactive programming
- Service Workers for PWA
- Dexie for IndexedDB

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Angular CLI 17

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/five-a-side-manager-frontend.git
   cd five-a-side-manager-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local`:
   - `NG_APP_API_URL`: Your backend API URL

4. Run development server:
   ```bash
   npm start
   ```

   Navigate to `http://localhost:4200`

## Building for Production

```bash
npm run build
```

This generates optimized production build in `dist/frontend/` with service worker included.

## Project Structure

```
src/
├── app/
│   ├── core/              # Core services, guards, interceptors
│   ├── features/          # Feature modules (auth, matches, players, etc)
│   ├── shared/            # Shared components and utilities
│   └── app.routes.ts      # Application routing
├── environments/          # Environment configuration
├── assets/               # Static assets
└── styles.css            # Global styles
```

## Key Components

- **LoginComponent**: User authentication
- **DashboardComponent**: Player management
- **MatchesComponent**: Browse and create matches
- **MatchDetailComponent**: View match details and team setup
- **AdminDashboardComponent**: Admin statistics and user management
- **FeedbackComponent**: Submit user feedback

## Environment Configuration

### Development
`environment.development.ts` - Local backend at `http://localhost:3000`

### Production
`environment.ts` - Update with your Railway backend URL

## PWA Features

- **Service Worker**: Offline support and caching
- **Manifest**: Install app on home screen
- **Offline Mode**: View cached data without internet
- **Push Notifications**: In-app notifications

### Install PWA

1. Open app in supported browser
2. Click install icon (URL bar) or menu → "Install"
3. App will be installed like a native app

## Deployment

See [DEPLOYMENT_STEPS.md](../DEPLOYMENT_STEPS.md) for complete deployment instructions to Vercel.

### Quick Deploy to Vercel

1. Push code to GitHub
2. Go to Vercel.com
3. Import GitHub repository
4. Set environment variables
5. Deploy!

## Development Server

```bash
npm start
```

## Testing

```bash
npm test
```

## Build Optimization

- Tree-shaking enabled
- Code splitting
- Service Worker caching strategies
- Lazy-loaded feature modules

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Push to your fork
6. Submit a pull request

## License

ISC

## Troubleshooting

### Build fails with "dist/frontend not found"
- Run `npm run build` first
- Check `angular.json` for correct output path

### API calls fail in production
- Verify `NG_APP_API_URL` in Vercel environment variables
- Check backend CORS allows your Vercel domain
- Check backend is running and accessible

### PWA not installing
- Ensure HTTPS is used (Vercel provides this)
- Check manifest.webmanifest is valid
- Check service worker registration in console
