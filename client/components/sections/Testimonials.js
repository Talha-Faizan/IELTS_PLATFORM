import BentoCard from "../ui/BentoCard";
import Icon from "@/components/ui/Icon";

const TESTIMONIALS = [
  {
    name: "Priya Menon",
    band: "8.5",
    country: "India → University of Edinburgh",
    quote:
      "The AI writing feedback was frighteningly accurate. It caught patterns in my essays that I had never noticed. Jumped from 6.5 to 8.5 in two months.",
    avatar: "PM",
  },
  {
    name: "Yusuf Al-Rashidi",
    band: "8.0",
    country: "UAE → University of Melbourne",
    quote:
      "The mock test environment is indistinguishable from the real exam. When test day came, I was completely calm because I had done it hundreds of times.",
    avatar: "YA",
  },
  {
    name: "Chen Wei",
    band: "7.5",
    country: "China → UCL London",
    quote:
      "My reading speed improved dramatically. The adaptive practice identified that I was losing time on matching headings. Three weeks of targeted practice fixed it.",
    avatar: "CW",
  },
];

function StarRating() {
  return (
    <div className="flex gap-0.5">
      {Array(5).fill(0).map((_, i) => (
        <Icon key={i} name="star" size={16} className="text-primary fill-primary" />
      ))}
    </div>
  );
}

export default function Testimonials() {
  return (
    <section className="w-full">
      <div className="text-center mb-12">
        <h2 className="font-montserrat text-headline-lg text-on-surface mb-3">
          Students Who Made It
        </h2>
        <p className="font-montserrat text-body-lg text-on-surface-variant">
          Real results from real students.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        {TESTIMONIALS.map(({ name, band, country, quote, avatar }) => (
          <BentoCard key={name} className="flex flex-col gap-4">
            <StarRating />
            <p className="font-montserrat text-body-md text-on-surface-variant italic flex-grow">
              &ldquo;{quote}&rdquo;
            </p>
            <div className="flex items-center gap-3 pt-4 border-t border-outline-variant/20">
              <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center font-montserrat font-bold text-sm text-primary">
                {avatar}
              </div>
              <div>
                <p className="font-montserrat text-label-lg text-on-surface">{name}</p>
                <p className="font-montserrat text-label-sm text-on-surface-variant">{country}</p>
              </div>
              <div className="ml-auto text-right">
                <span className="font-montserrat font-bold text-headline-md text-primary">
                  {band}
                </span>
                <p className="font-montserrat text-label-sm text-on-surface-variant">Band Score</p>
              </div>
            </div>
          </BentoCard>
        ))}
      </div>
    </section>
  );
}
