import { CreditCard } from "lucide-react";

const METHODS = [
  { icon: "card", title: "Pay with Card", subtitle: "Visa, Mastercard, Verve" },
  { icon: "ussd", title: "Pay via USSD", subtitle: "Dial *20211*5#" },
] as const;

export function PaymentMethods() {
  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <h2 className="font-bold mb-5">Payment Methods</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {METHODS.map((method) => (
          <div key={method.title} className="flex items-center gap-4 border border-border rounded-xl p-4">
            <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              {method.icon === "card" ? (
                <CreditCard size={18} className="text-primary" />
              ) : (
                <span className="text-destructive text-[10px] font-bold">USSD</span>
              )}
            </div>
            <div>
              <p className="font-medium text-sm">{method.title}</p>
              <p className="text-xs text-muted-foreground">{method.subtitle}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
