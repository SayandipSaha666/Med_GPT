export const razorpay: {
  orders: {
    create: (data: {
      amount: number;
      currency: string;
      receipt: string;
      notes: Record<string, string>;
    }) => Promise<any>;
  };
};
