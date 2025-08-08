'use client';

import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useState } from "react";
import { useAuth } from "@/app/AuthProvider";
import { useRouter } from "next/navigation";

interface PayPalCheckoutProps {
  credits: number;
  amount: number;
  packageType: 'small' | 'medium' | 'large';
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const initialOptions = {
  clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "AfcTYZp_s7XcNTTZWIRZdUAj5oshKGO8mG-IuKuLxtU2Bf2o2dCZtVyNvOZrDfRRR303Mo0tBixx8idn",
  currency: "USD",
  intent: "capture",
  components: "buttons",
  "buyer-country": "US"
};

export default function PayPalCheckout({ credits, amount, packageType, onSuccess, onError }: PayPalCheckoutProps) {
  const [message, setMessage] = useState("");
  const { user } = useAuth();
  const router = useRouter();

  if (!user) {
    return (
      <div className="text-center p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl">
        <p className="text-yellow-400">Please sign in to purchase credits</p>
      </div>
    );
  }

  return (
    <div className="paypal-container">
      <PayPalScriptProvider options={initialOptions}>
        <PayPalButtons
          style={{
            shape: "rect",
            layout: "vertical",
            color: "gold",
            tagline: false,
            height: 50,
          }}
          createOrder={async () => {
            try {
              const authToken = await user.getIdToken();

              const response = await fetch("/api/credits/purchase", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${authToken}`
                },
                body: JSON.stringify({
                  package: packageType
                }),
              });

              const orderData = await response.json();

              if (!response.ok) {
                throw new Error(orderData.error || 'Failed to create order');
              }

              return orderData.id;
            } catch (error) {
              console.error('Create order error:', error);
              setMessage(`Could not initiate PayPal Checkout: ${error}`);
              throw error;
            }
          }}
          onApprove={async (data, actions) => {
            try {
              const authToken = await user.getIdToken();

              const response = await fetch("/api/credits/complete", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${authToken}`
                },
                body: JSON.stringify({
                  orderID: data.orderID,
                }),
              });

              const orderData = await response.json();

              if (!response.ok) {
                throw new Error(orderData.error || 'Payment capture failed');
              }

              if (orderData.status === "COMPLETED") {
                setMessage(`Payment completed successfully!`);

                if (onSuccess) {
                  onSuccess();
                }

                setTimeout(() => {
                  router.push('/buy-credits/success?payment=success');
                }, 2000);
              }
            } catch (error) {
              console.error('Approve error:', error);
              const errorMessage = error instanceof Error ? error.message : String(error);
              setMessage(`Sorry, your transaction could not be processed: ${errorMessage}`);
              if (onError) {
                onError(errorMessage);
              }
            }
          }}
          onError={(err) => {
            console.error("PayPal error:", err);
            setMessage("PayPal encountered an error. Please try again.");
            if (onError) {
              onError("PayPal encountered an error. Please try again.");
            }
          }}
        />
      </PayPalScriptProvider>
      {message && (
        <div className="text-center mt-4 p-4 bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700/50">
          <p className="text-sm text-gray-300">{message}</p>
        </div>
      )}
    </div>
  );
}