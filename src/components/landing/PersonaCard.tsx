interface PersonaCardProps {
  label: string;
  situation: string;
  quote: string;
}

export function PersonaCard({ label, situation, quote }: PersonaCardProps) {
  return (
    <article className="p-4 rounded-2xl bg-card/70 dark:bg-card/40 border border-border/50 backdrop-blur-sm space-y-2">
      <p className="text-xs font-semibold text-primary">{label}</p>
      <p className="text-sm font-semibold text-foreground leading-snug">
        {situation}
      </p>
      <blockquote className="text-sm italic text-muted-foreground leading-relaxed">
        “{quote}”
      </blockquote>
    </article>
  );
}
