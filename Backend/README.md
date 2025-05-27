# Debreberhan City Hotel Recommender

A full-stack web application for recommending and booking hotels in Debreberhan, Ethiopia.

## Features

### User Features
- User authentication (signup, login, password reset)
- Hotel search with filters
- Booking management
- View booking history

### Hotel Manager Features
- Dashboard for managing hotels
- Room management
- Booking management
- Hotel information updates

### Admin Features
- User management
- Hotel management
- Reporting and analytics

## Technology Stack

- **Frontend**: React.js
- **Backend**: Node.js with Express.js
- **Database**: MongoDB
- **Authentication**: JWT

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/debreberhan-hotel-recommender.git
cd debreberhan-hotel-recommender
```

2. Install dependencies
```bash
npm install
```

3. Create a .env file in the root directory with the following variables:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/hotel-recommender
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=30d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your_email@gmail.com
SMTP_PASSWORD=your_app_password
FRONTEND_URL=http://localhost:3000
```

4. Start the development server
```bash
npm run dev
```

## API Endpoints

### Authentication
- POST /api/v1/auth/register - Register a new user
- POST /api/v1/auth/login - Login user
- GET /api/v1/auth/me - Get current user
- POST /api/v1/auth/forgotpassword - Forgot password
- PUT /api/v1/auth/resetpassword/:resettoken - Reset password

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 