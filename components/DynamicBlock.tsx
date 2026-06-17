import type { UiBlock } from "@/agent/lib/schemas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function DynamicBlock({ block }: { block: UiBlock }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{block.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {block.type === "stat" && (
          <p className="text-3xl font-bold">{block.value}</p>
        )}
        {block.type === "checklist" && (
          <ul className="space-y-2">
            {block.items.map((item) => (
              <li key={item.label} className="flex items-center gap-2 text-sm">
                <Badge className={item.done ? "" : "bg-muted text-muted-foreground"}>
                  {item.done ? "done" : "todo"}
                </Badge>
                {item.label}
              </li>
            ))}
          </ul>
        )}
        {block.type === "links" && (
          <ul className="space-y-1">
            {block.items.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary underline"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        )}
        {block.type === "table" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {block.columns.map((col) => (
                    <th key={col} className="border-b border-border px-2 py-1 text-left">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j} className="border-b border-border px-2 py-1">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {block.type === "markdown" && (
          <pre className="whitespace-pre-wrap text-sm">{block.content}</pre>
        )}
      </CardContent>
    </Card>
  );
}
