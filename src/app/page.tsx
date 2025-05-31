// src/app/page.tsx
import MainLayout from "./(main)/layout";
import SocialFeedPageContent from "./(main)/page"; // Renamed to avoid potential naming conflicts

export default function RootPage() {
  return (
    <MainLayout>
      <SocialFeedPageContent />
    </MainLayout>
  );
}
