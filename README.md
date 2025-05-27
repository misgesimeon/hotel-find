# Hotel Recommender System

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

- **Frontend**: React.js with Material-UI
- **Backend**: Node.js with Express.js
- **Database**: MongoDB
- **Authentication**: JWT
- **Payment**: Telebirr Integration

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/hotel-recommender.git
cd hotel-recommender
```

2. Install dependencies
```bash
# Install backend dependencies
cd Backend
npm install

# Install frontend dependencies
cd ../client
npm install
```

3. Create a .env file in the Backend directory with the following variables:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/hotel-recommender
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=30d
FRONTEND_URL=http://localhost:3000
```

4. Start the development servers
```bash
# Start backend server (from Backend directory)
npm run dev

# Start frontend server (from client directory)
npm start
```

## Deployment

The application is configured for deployment on Render.com. See the `render.yaml` file for deployment configuration.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. 