
// src/app/page.tsx
import MainLayout from "./(main)/layout";
// The import name now matches the default exported component from (main)/page.tsx
import SocialFeedPageContent from "./(main)/page"; 

export default function RootPage() {
  return (
    <MainLayout>
      <SocialFeedPageContent />
    </MainLayout>
  );
}
