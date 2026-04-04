import Link from 'next/link';
import { copy } from '@/lib/copy';

export const metadata = {
  title: `${copy.terms.title} — ${copy.site.title}`,
  description: 'Terms of service for future.',
};

export default function TermsPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-16 sm:py-20">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-violet-500 dark:hover:text-violet-400 transition-colors uppercase tracking-widest mb-10"
      >
        {copy.terms.backHome}
      </Link>
      <h1 className="text-4xl sm:text-5xl font-serif mb-2 bg-gradient-to-r from-violet-400 to-fuchsia-300 bg-clip-text text-transparent">
        {copy.chart.titlePrefix} {copy.terms.title} {copy.chart.titleSuffix}
      </h1>
      <p className="text-muted-foreground text-sm font-bold mb-10">{copy.terms.lastUpdated}</p>
      <p className="text-foreground/90 leading-relaxed mb-10">{copy.terms.intro}</p>

      <section className="space-y-8">
        <div>
          <h2 className="text-lg font-serif text-foreground mb-2">{copy.terms.sections.acceptance}</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            By accessing or using future, you agree to be bound by these terms. If you do not agree, please do not use
            our services.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-serif text-foreground mb-2">{copy.terms.sections.use}</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            You may use our services for personal, non-commercial use. You agree not to misuse the service, attempt to
            gain unauthorized access, or use it for any illegal purpose. We provide astrological content for
            entertainment and reflection; it is not a substitute for professional advice.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-serif text-foreground mb-2">{copy.terms.sections.account}</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            If you create an account, you are responsible for keeping your credentials secure and for all activity under
            your account. We may suspend or terminate accounts that violate these terms.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-serif text-foreground mb-2">{copy.terms.sections.content}</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Content you save (e.g. charts, labels) remains yours. By using the service you grant us the limited rights
            needed to store and display that content. Do not upload content that infringes others’ rights or is
            unlawful.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-serif text-foreground mb-2">{copy.terms.sections.contact}</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            For questions about these terms, please contact us through the contact information provided on the site.
          </p>
        </div>
      </section>

      <p className="mt-14">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-violet-500 dark:hover:text-violet-400 transition-colors uppercase tracking-widest"
        >
          {copy.terms.backHome}
        </Link>
      </p>
    </main>
  );
}
