import { Info } from 'lucide-react';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
} from '~/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '~/components/ui/tooltip';

interface HelpInfoProps {
  message: string;
}

export function HelpInfo({ message }: HelpInfoProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop: Tooltip */}
      <div className="hidden md:inline-flex">
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="ml-2 h-4 w-4 cursor-help text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs text-sm">{message}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Mobile: Dialog */}
      <div className="inline-flex md:hidden">
        <Info
          className="ml-2 h-4 w-4 cursor-pointer text-muted-foreground"
          onClick={() => setOpen(true)}
        />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogDescription className="pt-4">{message}</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
