import { ContactSupportCard } from '~/components/help/ContactSupportCard';
import { HelpFaqCard } from '~/components/help/HelpFaqCard';

export function HelpCards() {
  return (
    <div className="flex flex-col-reverse items-start gap-6 lg:grid lg:grid-cols-[1.1fr_0.9fr]">
      <HelpFaqCard />
      <ContactSupportCard />
    </div>
  );
}
