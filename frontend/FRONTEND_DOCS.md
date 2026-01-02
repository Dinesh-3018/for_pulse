# Frontend Documentation

## Project Overview
This project is a React-based video analysis application built with Vite. It features user authentication, video uploading, real-time analysis status updates, and a dashboard for viewing results.

### Tech Stack
- **Framework**: React (Vite)
- **State Management**: Redux Toolkit
- **Styling**: Tailwind CSS, Lucide React (Icons)
- **HTTP Client**: Axios
- **Real-time**: Socket.io Client

## Architecture

### Folder Structure
```
src/
├── components/     # Reusable UI components
├── pages/          # Page components (routes)
├── services/       # API and Socket services
├── store/          # Redux store and slices
├── App.jsx         # Main application component
├── main.jsx        # Entry point
└── config.js       # Global configuration
```

## Key Components

### Dashboard (`pages/Dashboard.jsx`)
The main hub for logged-in users. It manages:
- Fetching and displaying the video list.
- Handling video selection and playback.
- Integrating with `socket.js` for real-time updates on video processing.
- Managing onboarding flow visibility.

### VideoList (`components/VideoList.jsx`)
Displays a grid of video thumbnails. It handles:
- Rendering video cards with thumbnails.
- Loading states and error handling.
- Dispatching video selection events.

### VideoPlayer (`components/VideoPlayer.jsx`)
A custom video player wrapper.

### OnboardingModal (`components/OnboardingModal.jsx`)
A multi-step modal for new users to set preferences (e.g., AI analyzer type).

## State Management (Redux)

### Auth Slice (`store/slices/authSlice.js`)
Manages user authentication state:
- `user`: Current user object.
- `token`: JWT token.
- `isAuthenticated`: Boolean flag.
- Actions: `login`, `register`, `logout`.

### Video Slice (`store/slices/videoSlice.js`)
Manages video data:
- `videos`: Array of video objects.
- `currentVideo`: Currently selected video.
- `uploadProgress`: Percentage for file uploads.
- `processingStatus`: Real-time status of analysis.

## Services

### API Service (`services/api.js`)
Configured Axios instance with:
- Base URL from `config.js`.
- Interceptors to attach JWT token to requests.
- Standardized error handling.

### Socket Service (`services/socket.js`)
Manages WebSocket connections:
- Connects to the backend using `socket.io-client`.
- Listens for events: `video_processing_start`, `video_processing_progress`, `video_processing_complete`, `video_processing_error`.
- Throttles updates to prevent Redux state thrashing.

## Styling
The project uses Tailwind CSS for utility-first styling.
- **Colors**: Custom color palette defined in `tailwind.config.js` (if strictly followed).
- **Responsive**: Mobile-first design principles (`sm:`, `lg:` prefixes).
