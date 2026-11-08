// Store policy text. Business-specific details come from lib/business.js (environment variables);
// any that are not set yet render as a visible "to be added" marker instead of a guess.
// Have the final text reviewed by the business owner (and a lawyer) before launch.
import { business as b } from '@/lib/business';

export const POLICIES = {
  shipping: {
    title: 'Shipping & delivery',
    summary: 'Where we deliver, how long it takes and what it costs.',
    sections: (ctx) => [
      ['Where we deliver', ['We deliver to addresses in India with a valid 6-digit PIN code.']],
      ['Dispatch and delivery times', [
        ['Orders are packed and dispatched within ', { f: 'dispatchDays', suffix: ' business days' }, ' of payment.'],
        ['Delivery usually takes ', { f: 'deliveryDays', suffix: ' business days' }, ' after dispatch, depending on your location.'],
        'You can follow your order status on the Your orders page.',
      ]],
      ['Delivery charges', [ctx.deliveryText, 'The exact charge is shown in your bag and at checkout before you pay.']],
      ['Damaged or missing items', [
        ['If a parcel arrives damaged or an item is missing, contact us within 48 hours of delivery at ', { f: 'email' }, ' with your order number and photos, and we will put it right.'],
      ]],
    ],
  },
  refunds: {
    title: 'Returns & refunds',
    summary: 'Cancelling, returning and getting your money back.',
    sections: () => [
      ['Cancelling an order', [
        'You can cancel an order yourself from the Your orders page until it is packed. If you have already paid, the full amount is refunded automatically.',
        'Orders that are not paid within the payment window are cancelled automatically and nothing is charged.',
      ]],
      ['Returns', [
        ['Unused items in their original packaging can be returned within ', { f: 'returnDays', suffix: ' days' }, ' of delivery. Contact us at ', { f: 'email' }, ' to arrange a return.'],
        'For hygiene and safety, opened liquids (rain repellent, washer fluid) and used wiper blades or towels cannot be returned unless they arrived faulty.',
      ]],
      ['Refunds', [
        'Refunds go back to the original payment method through Razorpay. Once we issue a refund, banks usually take 5–7 working days to show it.',
        'If a refund has not reached you after 7 working days, contact us with your order number and we will chase it with the payment provider.',
      ]],
      ['Wrong size?', ['If the blades you received do not fit, contact us before fitting them. Unused blades in original packaging can be exchanged for another size, subject to stock.']],
    ],
  },
  terms: {
    title: 'Terms & conditions',
    summary: 'The rules for using this site and buying from us.',
    sections: () => [
      ['Who we are', [[ 'This store is operated by ', { f: 'legalName' }, ', ', { f: 'address' }, '.', ], ['GSTIN: ', { f: 'gstin', optional: true }]]],
      ['Orders and prices', [
        'Prices are in Indian rupees. The total you pay, including any delivery charge and discount, is shown at checkout before payment.',
        'An order is confirmed only after payment is received. We may cancel and fully refund an order if an item is out of stock or a price was shown in error.',
      ]],
      ['Payments', ['Payments are processed by Razorpay. We do not see or store your card, UPI or bank details.']],
      ['Promo codes', ['Promo codes have their own conditions (minimum order, dates, number of uses) shown when you apply them. One code per order. Codes have no cash value.']],
      ['Product information and fit', [
        'Specifications are taken from product packaging. Vehicle compatibility results are a guide based on recorded blade lengths and connector types; please check your existing blades or owner’s manual before fitting.',
        'The weather simulator and 3D models are illustrations and not measurements of product performance.',
      ]],
      ['Care assistant', ['The care assistant gives general guidance. It is not a substitute for a professional inspection; if your visibility is impaired, stop safely and get help.']],
      ['Governing law', [['These terms are governed by the laws of India. Courts at ', { f: 'jurisdiction' }, ' have jurisdiction.']]],
    ],
  },
  privacy: {
    title: 'Privacy policy',
    summary: 'What we collect, why, and your choices.',
    sections: () => [
      ['What we collect', [
        'Account details you give us: name, email address and a password (stored only as a secure hash).',
        'Order details: items, delivery address and phone number.',
        'Payment references from Razorpay (such as a payment ID and method). We never receive your card, UPI PIN or bank login.',
        'Messages you send to the care assistant, to answer them.',
      ]],
      ['Why we use it', ['To process and deliver orders, handle cancellations and refunds, provide customer support, prevent fraud, and send a blade replacement reminder if you asked for one.']],
      ['Who we share it with', [
        'Razorpay, to take payments; our delivery partners, to deliver your order; our hosting and database providers, to run the site.',
        'If AI answers are enabled, messages to the care assistant are processed by Anthropic to generate a reply. Do not include personal details in them.',
        'We do not sell your personal data.',
      ]],
      ['Cookies and storage', ['We use one essential cookie to keep you signed in, and your browser’s storage for your bag and comparison list. We do not use advertising cookies.']],
      ['Your choices', [
        ['You can cancel reminders from Your orders. To see, correct or delete your data, email ', { f: 'email' }, '.'],
      ]],
    ],
  },
};
