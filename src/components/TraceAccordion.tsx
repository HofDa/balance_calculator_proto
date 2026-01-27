import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { Trace } from '@/engine/types';

export function TraceAccordion({ trace }: { trace: Trace }) {
  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="trace">
        <AccordionTrigger className="accordion-trigger-green">
          {trace.title}
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2 text-sm">
            {trace.lines.map((l, idx) => {
              if (l.kind === 'text') return <p key={idx}>{l.text}</p>;
              return (
                <div key={idx} className="rounded-md border p-2">
                  <div className="text-muted-foreground">{l.label}</div>
                  <div className="font-mono">{l.expression}</div>
                </div>
              );
            })}
            {trace.assumptions?.length ? (
              <div className="pt-2">
                <div className="text-xs font-semibold text-muted-foreground">
                  Annahmen
                </div>
                <ul className="list-disc pl-5 text-xs text-muted-foreground">
                  {trace.assumptions.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
