import { Footer } from '@/widgets/footer';
import { Header } from '@/widgets/header';
import { SearchBar } from '@/widgets/search-bar';
import { PageTransition } from '@/shared/ui/page-transition';

export default function Home() {
  return (
    <>
      <PageTransition>
        <div className="min-h-screen bg-[#D2DEEA]">
          <Header />
          <div className="flex min-h-[calc(100vh-var(--app-header-height))] flex-col">
            <div className="px-6 pt-6 text-text-body">
              <p className="text-2xl font-bold">[멘트 수정]</p>
            </div>

            <SearchBar />

            <div className="flex flex-1 flex-col pb-0">
              <div className="mt-30 flex-1 w-full rounded-t-3xl bg-white shadow-[0_-8px_24px_rgba(53, 85, 139, 333)]" />
            </div>
          </div>
          <Footer />
        </div>
      </PageTransition>
    </>
  );
}
