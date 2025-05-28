
interface PageHeaderProps {
  title: string;
  description?: string;
  className?: string;
}

export function PageHeader({ title, description, className }: PageHeaderProps) {
  return (
    <div className={`mb-8 md:mb-12 ${className}`}>
      <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">{title}</h1>
      {description && <p className="mt-2 text-lg text-muted-foreground">{description}</p>}
    </div>
  );
}
