import { HeroSection } from '@/components/home/HeroSection';
import { PredictQuestionCards } from '@/components/home/PredictQuestionCards';

export default function HomePage() {
  return (
    <main className="max-w-6xl mx-auto px-3 sm:px-4 pb-10 sm:pb-12 flex flex-col items-center">
      <HeroSection />
      <PredictQuestionCards />
    </main>
  );
}
