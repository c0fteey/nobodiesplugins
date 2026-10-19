import type { Metadata } from "next";
import { DiscordIcon, InstagramIcon, TwitterIcon, YoutubeIcon } from "@/components/brand/icons";
import { ContactForm } from "@/components/store/contact-form";
import { FaqList } from "@/components/store/faq-list";
import { getFaqs, getSettings } from "@/lib/data/store";

export const metadata: Metadata = { title: "Help center" };

export default async function HelpPage() {
  const [faqs, settings] = await Promise.all([getFaqs(), getSettings()]);

  const info = [
    {
      id: "company",
      title: "Have any questions about our company or services?",
      text: "We're here to help! Please feel free to ask us anything about our company or the services we provide. We'll do our best to provide you with the information you need.",
    },
    {
      id: "refunds",
      title: "Do we issue refunds?",
      text: "Due to the virtual nature of our products, we do not offer refunds. However, we're here to address any questions or concerns you may have before making a purchase.",
    },
    {
      id: "bugs",
      title: "Did you find a bug or glitch in our system?",
      text: "We take bug reports seriously. Please provide us with more details about the issue you may encounter. Any information you can provide will help us investigate and resolve the problem.",
    },
  ];

  return (
    <>
      <section className="container-page pt-14">
        <p className="text-sm font-bold">Help Center</p>
        <h1 className="mt-2 text-5xl font-bold tracking-[-0.04em] sm:text-7xl">Looking for help?</h1>
      </section>

      <section className="container-page grid gap-12 py-16 lg:grid-cols-2">
        <ContactForm />
        <div className="space-y-10">
          {info.map((block) => (
            <div key={block.id} id={block.id}>
              <h2 className="text-[15px] font-bold">{block.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/85">{block.text}</p>
            </div>
          ))}
          <div>
            <h2 className="text-[15px] font-bold">Want to contact us directly?</h2>
            <p className="mt-3 text-sm text-white/85">
              Send an email to{" "}
              <a href={`mailto:${settings.supportEmail}`} className="text-brand-soft hover:underline">
                {settings.supportEmail}
              </a>{" "}
              or join our discord
            </p>
          </div>
          <div className="flex items-center gap-6">
            <a
              href={settings.discordUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-brand-soft/60 px-6 text-brand-soft transition hover:bg-brand/10"
            >
              <DiscordIcon className="size-5" /> Join Discord
            </a>
            <YoutubeIcon className="size-7 text-brand-soft" />
            <TwitterIcon className="size-6 text-brand-soft" />
            <InstagramIcon className="size-6 text-brand-soft" />
          </div>
          <div id="terms" className="scroll-mt-8 rounded-lg bg-white/[0.03] p-5 text-xs leading-relaxed text-white/60">
            <p className="font-semibold text-white/80">Terms & Privacy</p>
            Purchases grant a non-transferable license for one network. We store only the data needed to run your
            account (email, purchases, licenses) and never sell it.
            <span id="privacy" />
          </div>
        </div>
      </section>

      {faqs.length > 0 && (
        <section className="container-page pb-24">
          <h2 className="text-center text-4xl font-bold tracking-[-0.03em] sm:text-6xl">Frequent asked Questions</h2>
          <div className="mx-auto mt-14 max-w-2xl">
            <FaqList faqs={faqs} variant="large" defaultOpen={faqs[0]?.id} />
          </div>
        </section>
      )}
    </>
  );
}
