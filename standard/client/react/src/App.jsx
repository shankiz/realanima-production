import React, { useState } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

// Renders errors or sucessfull transactions on the screen.
function Message({ content }) {
    return <p>{content}</p>;
}

function App() {
    const initialOptions = {
        "client-id": import.meta.env.PAYPAL_CLIENT_ID,
        "enable-funding": "",
        "disable-funding": "",
        country: "US",
        currency: "USD",
        "data-page-type": "product-details",
        components: "buttons",
        "data-sdk-integration-source": "developer-studio",
    };

    const [message, setMessage] = useState("");

    return (
        <div className="App">
            <PayPalScriptProvider options={initialOptions}>
                <PayPalButtons
                   style={{
                        shape: "rect",
                        layout: "vertical",
                        color: "gold",
                        label: "paypal",
                    }}
                   createVaultSetupToken={async () => {
                        try {
                            const response = await fetch("/api/vault", {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                },
                                // use the "body" param to optionally pass additional token information
                                body: JSON.stringify({
                                    payment_source: {
                                        paypal: {
                                            usage_type: "MERCHANT",
                                            experience_context: {
                                                return_url:
                                                    "https://example.com/returnUrl",
                                                cancel_url:
                                                    "https://example.com/cancelUrl",
                                            },
                                        },
                                    },
                                }),
                            });

                            const setupTokenData = await response.json();

                            if (setupTokenData.id) {
                                return setupTokenData.id;
                            }
                            const errorDetail = setupTokenData?.details?.[0];
                            const errorMessage = errorDetail
                                ? `${errorDetail.issue} ${errorDetail.description} (${setupTokenData.debug_id})`
                                : JSON.stringify(setupTokenData);

                            throw new Error(errorMessage);
                        } catch (error) {
                            console.error(error);
                            // resultMessage(`Could not create Setup token...<br><br>${error}`);
                        }
                    }}
                   onApprove={async (
                        data,
                        actions
                    ) => {
                        try {
                            const response = await fetch(
                                `/api/vault/payment-tokens`,
                                {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json",
                                    },
                                    body: {
                                        payment_source: {
                                            token: {
                                                id: data.vaultSetupToken,
                                                type: "SETUP_TOKEN",
                                            },
                                        },
                                    },
                                }
                            );

                            const paymentTokenData = await response.json();
                            const errorDetail = paymentTokenData?.details?.[0];

                            if (errorDetail) {
                                throw new Error(
                                    `${errorDetail.description} (${paymentTokenData.debug_id})`
                                );
                            } else {
                                console.log(
                                    "Payment Token",
                                    paymentTokenData,
                                    JSON.stringify(paymentTokenData, null, 2)
                                );
                            }
                        } catch (error) {
                            console.error(error);
                            resultMessage(
                                `Sorry, could not create tokenized payment source...<br><br>${error}`
                            );
                        }
                    }}
                />
            </PayPalScriptProvider>
            <Message content={message} />
        </div>
    );
}

export default App;
