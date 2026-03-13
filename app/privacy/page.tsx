import Link from 'next/link';
import { copy } from '@/lib/copy';

export const metadata = {
  title: `${copy.privacy.title} — ${copy.site.title}`,
  description: 'Privacy policy for future.',
};

export default function PrivacyPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-16 sm:py-20">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-violet-500 dark:hover:text-violet-400 transition-colors uppercase tracking-widest mb-10"
      >
        {copy.privacy.backHome}
      </Link>
      <h1 className="text-4xl sm:text-5xl font-serif mb-2 bg-gradient-to-r from-violet-400 to-fuchsia-300 bg-clip-text text-transparent">
        {copy.privacy.title}
      </h1>
      <p className="text-muted-foreground text-sm font-bold mb-10">{copy.privacy.lastUpdated}</p>
      <p className="text-foreground/90 leading-relaxed mb-10">{copy.privacy.intro}</p>

      <section className="space-y-8">
        <div>
          <h2 className="text-lg font-serif text-foreground mb-2">{copy.privacy.sections.collection}</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            We may collect information you provide when you create an account, save a chart, or contact us — such as
            email, name, and birth data you choose to save. We also collect basic usage data to improve the service.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-serif text-foreground mb-2">{copy.privacy.sections.use}</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            We use your information to provide and improve our services, to communicate with you, and to comply with
            legal obligations. We do not sell your personal information.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-serif text-foreground mb-2">{copy.privacy.sections.sharing}</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            We may share information with service providers who assist in operating the site, or when required by law.
            We do not share your data with third parties for their marketing purposes.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-serif text-foreground mb-2">{copy.privacy.sections.security}</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            We take reasonable steps to protect your information using industry-standard practices. No method of
            transmission over the internet is fully secure; we encourage you to use strong passwords and keep your
            account details private.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-serif text-foreground mb-2">{copy.privacy.sections.contact}</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            If you have questions about this privacy policy or your data, please contact us through the contact
            information provided on the site.
          </p>
        </div>
      </section>

      <p className="mt-14">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-violet-500 dark:hover:text-violet-400 transition-colors uppercase tracking-widest"
        >
          {copy.privacy.backHome}
        </Link>
      </p>
    </main>
  );
}
