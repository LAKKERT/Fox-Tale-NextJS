'use server';
import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
console.log('RESEND_API_KEY', RESEND_API_KEY)

const resend = new Resend(RESEND_API_KEY);

export default async function ResendEmailTransporter(data: {code: number, to: string}) {
    
    await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: ['lakkert2002@yandex.ru'],
        subject: 'hello world',
        html: `<p>it works! ${data.code}</p>`,
    })
}

// export default async function ResendEmailTransporter (_request: Request): Promise<Response> {
//     console.log('_requests', _request);
//     const res = await fetch("https://foxtale.verification.ru/emails", {
//         method: "POST",
//         headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${RESEND_API_KEY}`,
//         },
//         body: JSON.stringify({
//             from: "onboarding@resend.dev",
//             to: "delivered@resend.dev",
//             subject: "hello world",
//             html: `<strong>it works! ${_request.code}</strong>`,
//         }),
//     });
//     const data = await res.json();
//     return new Response(JSON.stringify(data), {
//         status: 200,
//         headers: {
//             "Content-Type": "application/json",
//         },
//     });
// };
