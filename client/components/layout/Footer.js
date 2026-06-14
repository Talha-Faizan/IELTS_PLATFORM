import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-outline-variant/20 bg-surface mt-24">
      <div className="max-w-container-max mx-auto px-margin-desktop py-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center md:items-start gap-1">
          <span className="font-montserrat font-black text-primary text-headline-md tracking-tight">
            IELTS Scholar
          </span>
          <span className="font-montserrat text-label-sm text-on-surface-variant">
            Academic Preparation Platform
          </span>
        </div>

        <nav className="flex flex-wrap justify-center gap-6">
          {["About", "Privacy", "Terms", "Contact", "Blog"].map((item) => (
            <Link
              key={item}
              href="#"
              className="font-montserrat text-label-sm text-on-surface-variant hover:text-primary transition-colors"
            >
              {item}
            </Link>
          ))}
        </nav>

        <p className="font-montserrat text-label-sm text-on-surface-variant text-center md:text-right">
          © {new Date().getFullYear()} IELTS Scholar. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
