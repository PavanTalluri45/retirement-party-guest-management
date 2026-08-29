import type { CheckInRecord } from "@/lib/check-in/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatShortDateTime,
  getRecordKey,
} from "@/lib/check-in-history/format";

interface HistoryTableProps {
  checkins: CheckInRecord[];
}

function getPartyNames(record: CheckInRecord): string[] {
  const names: string[] = [];

  if (record.guestName) {
    names.push(record.guestName);
  }

  if (Array.isArray(record.familyMembers) && record.familyMembers.length > 0) {
    record.familyMembers.forEach((member) => {
      if (typeof member === "string") {
        if (member.trim()) names.push(member.trim());
        return;
      }

      if (member?.name?.trim()) {
        names.push(member.name.trim());
      }
    });
  }

  return names;
}

const COLUMNS = ["Guests", "Checked in", "Method"];

export function HistoryTable({ checkins }: HistoryTableProps) {
  return (
    <div className="hidden overflow-x-auto sm:block">
      <Table className="text-xs">
        <TableHeader className="sticky top-0 bg-muted/40 backdrop-blur">
          <TableRow>
            {COLUMNS.map((column) => (
              <TableHead
                key={column}
                className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {column}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {checkins.map((record) => {
            const partyNames = getPartyNames(record);

            return (
              <TableRow
                key={getRecordKey(record)}
                className="align-top transition-colors hover:bg-muted/20"
              >
                <TableCell className="px-4 py-3.5 align-top">
                  <div className="space-y-1 text-sm font-medium text-foreground">
                    {partyNames.length > 0 ? (
                      partyNames.map((name, index) => (
                        <div key={`${name}-${index}`} className="truncate">
                          {name}
                        </div>
                      ))
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                </TableCell>

                <TableCell className="px-4 py-3.5 align-top font-medium tabular-nums text-muted-foreground">
                  {formatShortDateTime(record.checkedInAt)}
                </TableCell>

                <TableCell className="px-4 py-3.5 align-top font-medium tabular-nums text-muted-foreground">
                  {record.verificationMethod}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
