import { Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import SharedViewManager from "@/components/SharedViewManager";

export default function SharedLinksButton() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="default" className="gap-1.5">
          <Link2 className="h-4 w-4" />
          <span className="hidden sm:inline">Links Compartilhados</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-2xl">
        <DialogHeader>
          <DialogTitle>Links Compartilhados</DialogTitle>
        </DialogHeader>
        <SharedViewManager />
      </DialogContent>
    </Dialog>
  );
}
