
import MainLayout from "./(main)/layout";
import SocialFeedPage from "./(main)/page";

export default function HomePage() {
  // Wrap SocialFeedPage with MainLayout to ensure consistent layout (including Header)
  return (
    <MainLayout>
      <SocialFeedPage />
    </MainLayout>
  );
}
