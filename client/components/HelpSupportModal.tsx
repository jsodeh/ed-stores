import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Phone, 
  MessageCircle, 
  Mail, 
  ExternalLink 
} from "lucide-react";

interface HelpSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpSupportModal({ isOpen, onClose }: HelpSupportModalProps) {
  const contactMethods = [
    {
      title: "WhatsApp Support",
      description: "Get help via WhatsApp",
      icon: <MessageCircle className="h-5 w-5 text-green-500" />,
      action: () => window.open("https://wa.me/2348012345678", "_blank"),
      actionText: "Chat on WhatsApp",
      color: "bg-green-50 border-green-100",
      buttonColor: "bg-green-500 hover:bg-green-600 text-white"
    },
    {
      title: "Telegram Support",
      description: "Chat with our support team on Telegram",
      icon: <MessageCircle className="h-5 w-5 text-blue-500" />,
      action: () => window.open("https://t.me/edsupport", "_blank"),
      actionText: "Open Telegram",
      color: "bg-blue-50 border-blue-100",
      buttonColor: "bg-blue-500 hover:bg-blue-600 text-white"
    },
    {
      title: "Phone Support",
      description: "Call our customer service",
      icon: <Phone className="h-5 w-5 text-primary" />,
      action: () => window.open("tel:+2348012345678", "_blank"),
      actionText: "Call +234 801 234 5678",
      color: "bg-primary/10 border-primary/20",
      buttonColor: "bg-primary hover:bg-primary/90 text-white"
    },
    {
      title: "Email Support",
      description: "Send us an email",
      icon: <Mail className="h-5 w-5 text-purple-500" />,
      action: () => window.open("mailto:support@edsuperstores.com", "_blank"),
      actionText: "Email Us",
      color: "bg-purple-50 border-purple-100",
      buttonColor: "bg-purple-500 hover:bg-purple-600 text-white"
    }
  ];
  
  const faqs = [
    {
      question: "How do I place an order?",
      answer: "Browse our products, add items to your cart, and proceed to checkout. You can pay via bank transfer or choose cash on delivery."
    },
    {
      question: "What are your delivery options?",
      answer: "We offer delivery within 3-5 business days to all major cities in Nigeria. Delivery is free for orders over ₦50,000."
    },
    {
      question: "How can I track my order?",
      answer: "You can track your order using the 'Track Your Order' feature on our website by entering your order number."
    },
    {
      question: "What is your return policy?",
      answer: "We accept returns within 7 days of delivery. Items must be unused and in their original packaging."
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Help & Support</DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Contact Us</h3>
            <div className="grid gap-3">
              {contactMethods.map((method, index) => (
                <div 
                  key={index} 
                  className={`border rounded-lg p-4 ${method.color}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    {method.icon}
                    <h4 className="font-medium">{method.title}</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{method.description}</p>
                  <Button 
                    onClick={method.action}
                    className={`w-full ${method.buttonColor}`}
                  >
                    {method.actionText}
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-3">Frequently Asked Questions</h3>
            <div className="space-y-3">
              {faqs.map((faq, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <h4 className="font-medium mb-1">{faq.question}</h4>
                  <p className="text-sm text-gray-600">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}