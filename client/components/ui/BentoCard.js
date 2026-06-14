export default function BentoCard({ children, className = "", colSpan = "", as: Tag = "div", href, ...props }) {
  const base = `bento-card ${colSpan} ${className}`;

  if (href) {
    return (
      <a href={href} className={`${base} block`} {...props}>
        {children}
      </a>
    );
  }

  return (
    <Tag className={base} {...props}>
      {children}
    </Tag>
  );
}
