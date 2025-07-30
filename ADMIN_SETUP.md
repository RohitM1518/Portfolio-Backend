# Admin Dashboard Setup Guide

This guide will help you set up the admin dashboard for your portfolio website.

## Prerequisites

- Node.js and npm installed
- MongoDB database running
- Backend server running

## Setup Steps

### 1. Install Dependencies

Make sure all backend dependencies are installed:

```bash
cd backend
npm install
```

### 2. Environment Variables

Ensure your `.env` file has the following variables:

```env
MONGODB_URI=your_mongodb_connection_string
CORS_ORIGIN=http://localhost:5173
ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=10d
PORT=8001
BACKEND_URL=http://localhost:8001/api/v1
```

### 3. Create Admin User

Run the following command to create the first admin user:

```bash
npm run create-admin
```

This will create an admin user with:
- Username: `admin`
- Password: `admin123`
- Email: `admin@portfolio.com`
- Role: `super_admin`

**Important**: Change the password after first login for security.

### 4. Start the Backend Server

```bash
npm run dev
```

The server will start on port 8001.

### 5. Frontend Setup

Make sure your frontend `.env` file includes:

```env
VITE_API_URL=http://localhost:8001/api/v1
VITE_BACKEND_URL=http://localhost:8001
```

### 6. Access Admin Dashboard

1. Navigate to `http://localhost:5173/admin/login`
2. Login with the credentials created in step 3
3. You'll be redirected to the admin dashboard at `http://localhost:5173/admin/dashboard`

## Admin Dashboard Features

- **Analytics Overview**: View total interactions, recent activity, unique visitors
- **Interaction Types**: Breakdown of different types of user interactions
- **Page Visits**: Most visited pages on your portfolio
- **Recent Activity**: Real-time feed of user interactions
- **Date Range Filtering**: Filter data by 7, 30, or 90 days
- **Responsive Design**: Works on desktop and mobile devices

## Security Features

- JWT-based authentication with access and refresh tokens
- Password hashing using bcrypt
- HTTP-only cookies for token storage
- Protected routes with automatic redirect to login
- Session management with automatic logout on token expiry

## API Endpoints

### Public Endpoints
- `POST /api/v1/admin/login` - Admin login
- `POST /api/v1/admin/refresh-token` - Refresh access token

### Protected Endpoints
- `POST /api/v1/admin/logout` - Admin logout
- `GET /api/v1/admin/me` - Get current admin info
- `GET /api/v1/admin/dashboard/stats` - Get dashboard statistics
- `GET /api/v1/admin/interactions` - Get interaction details

## Troubleshooting

### Common Issues

1. **Login fails**: Check if admin user exists and credentials are correct
2. **Dashboard not loading**: Verify backend server is running and accessible
3. **CORS errors**: Ensure CORS_ORIGIN in .env matches your frontend URL
4. **Database connection**: Verify MongoDB URI is correct and database is accessible

### Reset Admin Password

If you need to reset the admin password, you can:

1. Delete the admin user from the database
2. Run `npm run create-admin` again
3. Or update the password directly in the database

## Customization

You can customize the admin dashboard by:

- Modifying the AdminDashboard component in `frontend/src/pages/AdminDashboard.jsx`
- Adding new API endpoints in `backend/src/controllers/adminController.js`
- Updating the admin model in `backend/src/models/adminModel.js`
- Customizing the theme and styling

## Security Best Practices

1. Change the default admin password immediately
2. Use strong, unique passwords
3. Regularly rotate JWT secrets
4. Monitor admin access logs
5. Consider implementing rate limiting
6. Use HTTPS in production
7. Regularly backup your database 