import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { 
  MoreHorizontal, 
  Package, 
  HelpCircle, 
  User,
  ChevronUp
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { OrderTrackingModal } from "./OrderTrackingModal";
import { HelpSupportModal } from "./HelpSupportModal";

export function QuickActionsButton() {
  const [open, setOpen] = useState(false);
  const [showOrderTracking, setShowOrderTracking] = useState(false);
  const [showHelpSupport, setShowHelpSupport] = useState(false);
  const navigate = useNavigate();

  const actions = [
    {
      id: "track",
      label: "Track Your Order",
      icon: Package,
      action: () => {
        setOpen(false);
        setShowOrderTracking(true);
      },
    },
    {
      id: "help",
      label: "Help & Support",
      icon: HelpCircle,
      action: () => {
        setOpen(false);
        setShowHelpSupport(true);
      },
    },
    {
      id: "account",
      label: "My Account",
      icon: User,
      action: () => {
        setOpen(false);
        navigate("/profile");
      },
    },
  ];

  return (
    <>
      {/* Floating Action Button */}
      <Button
        onClick={() => setOpen(true)}
        className="md:hidden fixed bottom-20 right-4 z-40 rounded-full w-12 h-12 shadow-lg bg-primary hover:bg-primary/90"
      >
        <MoreHorizontal className="h-5 w-5" />
      </Button>

      {/* Sheet/Bottom Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="h-auto rounded-t-xl pb-8 px-4">
          <div className="flex justify-center mb-2">
            <div className="w-12 h-1 rounded-full bg-gray-200" />
          </div>
          <h3 className="text-lg font-semibold mb-4 flex items-center justify-center">
            Quick Actions
            <ChevronUp className="ml-2 h-5 w-5" />
          </h3>
          <div className="space-y-2">
            {actions.map((action) => (
              <Button
                key={action.id}
                variant="outline"
                className="w-full justify-start gap-2 py-6 text-base"
                onClick={action.action}
              >
                <action.icon className="h-5 w-5" />
                {action.label}
              </Button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Modals */}
      <OrderTrackingModal 
        isOpen={showOrderTracking} 
        onClose={() => setShowOrderTracking(false)} 
      />
      <HelpSupportModal 
        isOpen={showHelpSupport} 
        onClose={() => setShowHelpSupport(false)} 
      />
    </>
  );
}