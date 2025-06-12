# Library Management System [LMS]

##### Created By : Praya Labs
##### Developed By : Usham Roy

## Features

### Core Functionality
- **User Authentication** with session management and security verification
- **Book Search & Discovery** with real-time suggestions and filtering
- **Book Reservations** and availability tracking
- **User Profile Management** with borrowing history
- **Responsive Design** optimized for desktop and mobile devices
- **Progressive Web App** capabilities for offline access

### Advanced Features
- **Multi-field Search** (Title, Author, ISBN)
- **Real-time Auto-suggestions** with intelligent caching
- **Category-based Filtering**
- **Session Management** with automatic timeout
- **CAPTCHA/Math Verification** for enhanced security
- **Loading States & Skeleton Screens** for better UX
- **Error Handling** with graceful degradation

## Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Authentication**: HTTP Basic Auth with CSRF protection
- **API Integration**: RESTful APIs with JSON API format
- **State Management**: React Context API
- **PWA**: Service Worker, Web App Manifest
- **Icons**: Lucide React

##  Prerequisites

- Node.js 18.0 or higher
- npm, yarn, or pnpm package manager
- Access to the library management API endpoints

## Getting Started

### 1. Clone the Repository
```bash
git clone <repository-url>
cd library-management-system
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Environment Setup
Create a `.env.local` file in the root directory:
```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=https://lib.prayalabs.com
NEXT_PUBLIC_APP_NAME=Library Management System

# Optional: Analytics and monitoring
NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id
```

### 4. Run Development Server
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for Production
```bash
npm run build
npm start
```

##  Project Structure

```
├── app/                    # Next.js App Router
│   ├── api/               # API routes (proxy, captcha)
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx          # Home page
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── dashboard/        # Dashboard components
│   ├── debug/            # Debug and testing tools
│   └── ui/               # Reusable UI components
├── lib/                  # Utility libraries
│   ├── api.ts           # API client and types
│   └── utils.ts         # Helper functions
├── public/              # Static assets
│   ├── manifest.json    # PWA manifest
│   └── favicon files    # App icons
└── types/               # TypeScript type definitions
```

## API Integration

### Authentication Flow
1. **Login**: `POST /web/user/login?_format=json`
2. **Session Management**: CSRF tokens and Basic Auth
3. **Logout**: `POST /web/user/logout`

### Data Fetching
- **Books**: `GET /web/jsonapi/lmsbook/lmsbook`
- **Authors**: `GET /web/lmsbookauthor/{id}?_format=json`
- **Publications**: `GET /web/jsonapi/lmsbook/lmsbook/{uuid}/lmspublication`
- **Categories**: `GET /web/jsonapi/lmsbook/lmsbook/{uuid}/lmsbook_category`

### User Operations
- **Reserve Book**: `POST /web/books/{id}/reserve?_format=json`
- **User Profile**: `GET /web/user/profile?_format=json`
- **Borrowed Books**: `GET /web/user/borrowed?_format=json`

## Configuration

### API Proxy
The application uses a proxy endpoint (`/api/proxy`) to handle CORS issues and centralize API communication.

### Security Features
- CAPTCHA verification for login
- Session timeout management (10 minutes)
- CSRF token validation
- HTTP Basic Authentication for sensitive endpoints

### PWA Configuration
- Offline capability
- App installation support
- Custom app icons and splash screens
- Service worker for caching

##  Testing & Debug Tools

The application includes comprehensive debug tools accessible through the Debug tab:

- **API Testing**: Test individual endpoints
- **Network Diagnostics**: Check connectivity and CORS
- **Author/Publication Testing**: Verify data relationships
- **Authentication Testing**: Validate login credentials

### Test Credentials
- **Username**: Alana Rivers
- **Password**: a

## PWA Features

### Installation
Users can install the app on their devices for a native-like experience.

### Offline Support
- Cached resources for offline browsing
- Service worker for background sync
- Fallback pages for network errors

##  UI/UX Features

### Design System
- Consistent color scheme and typography
- Responsive grid layouts
- Accessible form controls and navigation
- Loading states and error handling

### User Experience
- Real-time search suggestions
- Skeleton loading screens
- Toast notifications for actions
- Session timeout warnings

##  Deployment

### VPS (Recommended)
```bash
npm run build
vercel --prod
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables for Production
```env
NEXT_PUBLIC_API_BASE_URL=https://your-api-domain.com
NEXT_PUBLIC_APP_NAME=Your Library Name
```

## Support

For support and questions:
- Create an issue in the repository
- Check the debug tools in the application
- Review the API documentation

##  Version History

- **v1.0.0** - Initial release with core functionality
- **v1.1.0** - Added PWA features and enhanced search
- **v1.2.0** - Improved authentication and session management
- **v1.3.0** - Added debug tools and enhanced error handling
