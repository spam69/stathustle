// src/app/page.tsx
// This file ensures that the content defined in src/app/(main)/page.tsx
// is rendered for the root path ('/').
// The Next.js App Router will automatically wrap this page with the appropriate layouts:
// 1. src/app/(main)/layout.tsx (which provides FeedContext for the Header)
// 2. src/app/layout.tsx (RootLayout)

import SocialFeedPage from './(main)/page';

export default SocialFeedPage;
