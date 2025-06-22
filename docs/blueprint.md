# **App Name**: StatHustle Social

## Core Features:

- Account Management: Enable users to create and manage profiles, including sport interests and theme preferences.
- User Pages: Display user and identity profiles with social feeds, profile pictures, banners, and social links.
- Social Feed: Allow users to create, edit, report, and share posts with team attachments and user/player tagging.
- Blogs: Enable identities to create and share blog posts with inline images.
- Player Pages & Chats: Display player pages with tagged posts and short chat messages.
- Toast Messages: Implement user-friendly toast messages for backend errors.
- Feed Recommendations: Recommend sports content to users using AI based on each user's chosen favorite sports. Use the AI as a tool, making judgements about what the user wants to see in their feed, and ranking content accordingly.

## Style Guidelines:

- Primary color: HSL 210, 70%, 45% (RGB: #228BE6) for a clean, trustworthy feel.
- Background color: HSL 210, 20%, 95% (RGB: #F0F4F8) for a light, airy backdrop.
- Accent color: HSL 180, 65%, 40% (RGB: #2EC1AC) to highlight key interactive elements.
- Headline font: 'Space Grotesk', sans-serif, for a computerized, techy, scientific feel.
- Body font: 'Inter', sans-serif, for a modern, machined, objective, neutral look.
- Use a consistent set of vector-based icons for a modern, scalable look.
- Maintain a clean, card-based layout for posts and content to organize information efficiently.
- Incorporate subtle animations on interactive elements like buttons and notifications to enhance user engagement.

# Blueprint

This document outlines the high-level architecture and conventions of the StatHustle Social application.

## Table of Contents

- [Project Structure](#project-structure)
- [Authentication](#authentication)
- [Data Fetching & Caching](#data-fetching--caching)
- [State Management](#state-management)
- [Styling](#styling)
- [Forms](#forms)
- [Real-time Features](#real-time-features)
- [Key Libraries & Technologies](#key-libraries--technologies)

---

## Project Structure

The application follows the Next.js App Router structure.

-   `src/app/(auth)`: Routes for authentication (login, signup).
-   `src/app/(main)`: Main application routes after authentication.
-   `src/app/api`: API routes for server-side logic.
-   `src/components`: Reusable React components.
    -   `src/components/ui`: Shadcn/UI components.
    -   `src/components/layout`: Components related to the overall page structure (Header, Sidebar).
-   `src/contexts`: React Context providers for global state.
-   `src/hooks`: Custom React hooks for reusable logic.
-   `src/lib`: Utility functions, database connection, etc.
-   `src/models`: Mongoose models for database schemas.
-   `src/types`: TypeScript type definitions.

---

## Authentication

Authentication is handled via a custom implementation using JWTs stored in secure, HTTP-only cookies.

-   **Auth Context**: `src/contexts/auth-context.tsx` provides the `useAuth` hook, which gives access to the current user's state, loading status, and login/logout functions. It also manages the concept of "acting as an identity".
-   **API Routes**: `src/app/api/auth/` contains the logic for user registration and login.
-   **Middleware**: Middleware (`middleware.ts`) is used to protect routes and refresh tokens.

### Identity Management

A core feature is the ability for a `User` to create and manage multiple `Identities`. An `Identity` can be thought of as a persona or a brand account (e.g., "The Fantasy Football Guru").

-   Users can "act as" one of their identities.
-   When acting as an identity, all actions (posting, commenting, following) are attributed to the `Identity`, not the underlying `User`.
-   The `useAuth` hook manages the "active principal" which can be either the `User` or the selected `Identity`.

---

## Data Fetching & Caching

We use **TanStack Query (React Query)** for all server-state management.

-   **Query Keys**: Use descriptive and consistent query keys. A good practice is to use an array starting with the entity name and followed by any identifiers, e.g., `['profile', username]`.
-   **Mutations**: Use `useMutation` for creating, updating, or deleting data. Implement optimistic updates where possible to improve user experience.
-   **Providers**: The `QueryClientProvider` is set up in `src/components/providers.tsx`.

---

## State Management

-   **Server State**: TanStack Query is the primary tool.
-   **Client State**:
    -   For simple, local component state, use `useState` and `useReducer`.
    -   For global or cross-component state, use React Context. Current contexts include:
        -   `AuthContext`: Manages user authentication and identity switching.
        -   `FeedContext`: Manages the main content feed, including posts and interactions.
        -   `NotificationContext`: Handles fetching and managing user notifications.
        -   `CommentsModalContext`: Manages the state for the global comments modal.
        -   `MessagingContext`: Manages real-time chat, conversations, and the messaging modal visibility.

---

## Styling

-   **Framework**: [Tailwind CSS](https://tailwindcss.com/) is used for all styling.
-   **UI Components**: [Shadcn/UI](https://ui.shadcn.com/) provides the base component library. Components are customized and extended as needed.
-   **Theming**: `next-themes` is used for dark/light mode support. Theme switching logic is in `src/components/theme-switcher.tsx`.
-   **Fonts**: Custom fonts (`Inter` and `Space Grotesk`) are loaded in `src/app/layout.tsx`.

---

## Forms

-   **Library**: [React Hook Form](https://react-hook-form.com/) is the standard for building forms.
-   **Validation**: [Zod](https://zod.dev/) is used for schema validation, integrated with React Hook Form.
-   **Components**: Use the `Form` components from Shadcn/UI (`src/components/ui/form.tsx`) which are built to integrate smoothly with React Hook Form.

---

## Real-time Features

### Notifications & Messaging

-   **Technology**: [Socket.IO](https://socket.io/) is used for real-time communication between the client and server.
-   **Server**: A custom Socket.IO server is attached to the Next.js server instance. The WebSocket API is exposed via `/api/ws`.
-   **Client Hook**: `src/hooks/useMessaging.ts` encapsulates all client-side WebSocket logic for chat. It handles connection, event listeners, and provides functions to send messages and manage conversations.
-   **State Management**: The `MessagingContext` makes messaging state (conversations, messages, connection status) available throughout the app. It also manages the visibility of the `MessagingModal` so that it can be opened from anywhere in the application (e.g., the Header or a user's profile page).
-   **Notifications**: The `NotificationContext` follows a similar pattern for real-time notifications, though it may rely more on polling or server-sent events as currently implemented.

---

## Key Libraries & Technologies

-   **Framework**: Next.js (App Router)
-   **Language**: TypeScript
-   **Database**: MongoDB with Mongoose
-   **Styling**: Tailwind CSS
--   **UI Components**: Shadcn/UI
-   **State Management**: TanStack Query, React Context
-   **Forms**: React Hook Form with Zod
-   **Real-time**: Socket.IO
-   **Icons**: Lucide React
-   **Date Formatting**: `date-fns`