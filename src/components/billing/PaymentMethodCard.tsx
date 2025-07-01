import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Shield } from "lucide-react";
const PaymentMethodCard = () => {
  return <Card className="mb-8 surface-elevated">
      <CardHeader>
        <CardTitle className="flex items-center text-primary">
          <CreditCard className="h-5 w-5 mr-2" />
          Payment Method
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">VISA</span>
            </div>
            <div>
              <p className="font-medium text-primary">•••• •••• •••• 4242</p>
              <p className="text-sm text-muted-foreground">Expires 12/25</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-sm text-secondary">
              <Shield className="h-4 w-4 mr-1 text-success" />
              Secure
            </div>
            <Button variant="outline">Update</Button>
          </div>
        </div>
      </CardContent>
    </Card>;
};
export default PaymentMethodCard;