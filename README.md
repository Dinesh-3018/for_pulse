# Video Analyzer Project

A full-stack application for video analysis using Node.js, Express, and React.

## Project Structure

- **frontend/**: React application (Vite)
- **backend/**: Node.js/Express server
- **TestVideos/**: Directory for test video files

## Prerequisites

- Node.js (v18 or higher recommended)
- MongoDB (running locally or a cloud instance)
- ffmpeg (required for video processing)

## Installation

### 1. Clone the repository

```bash
git clone git@github.com:Dinesh-3018/for_pulse.git
cd sm
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory with the following variables:

```env
PORT=5001
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

## Running the Application

### Development Mode

**Backend:**

```bash
cd backend
npm run dev
```
(Runs on http://localhost:5001)

**Frontend:**

```bash
cd frontend
npm run dev
```
(Runs on http://localhost:5173)

### Production Build

**Frontend:**

```bash
cd frontend
npm run build
npm run preview
```

## Features

- Video upload and analysis
- User authentication
- Real-time status updates via Socket.io
- Dashboard for viewing results
