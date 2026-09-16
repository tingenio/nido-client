type SectionHeaderProps = {
  title: string;
  count?: number;
};

export function SectionHeader({ title, count }: SectionHeaderProps) {
  return (
    <h2 className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide">
      {title}
      {count !== undefined && (
        <span className="text-muted-foreground/70 font-normal normal-case">({count})</span>
      )}
    </h2>
  );
}
