'use client';

import { AlertCircle } from 'lucide-react';

export function MetaSandboxNotice() {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 shadow-sm backdrop-blur-sm space-y-2.5 max-w-2xl text-amber-900 animate-fade-in">
      <div className="flex items-center gap-2 font-semibold">
        <AlertCircle size={18} className="text-amber-600 flex-shrink-0" />
        <h4 className="text-sm font-semibold">Meta WhatsApp Sandbox Requirements</h4>
      </div>
      <div className="text-xs space-y-1.5 pl-6 list-disc list-outside leading-relaxed text-amber-800">
        <p>
          If you are using a Meta Developer Sandbox account (with test phone credentials), please ensure:
        </p>
        <ul className="space-y-1.5 list-disc pl-4">
          <li>
            <strong>Add Verified Number:</strong> The recipient's phone number (with country code, e.g., <code>+917028654498</code>) must be registered under <strong>"Verified Test Numbers"</strong> in your Meta Developer Dashboard (API Setup page).
          </li>
          <li>
            <strong>Initiate 24-Hour Window:</strong> The recipient must send any message (like <em>"hi"</em> or <em>"test"</em>) to the Sandbox Phone Number first. This opens the WhatsApp 24-hour Customer Service Window allowing you to receive free-form PDF files.
          </li>
          <li>
            <strong>Local Webhook Updates:</strong> Since your backend is running on <code>localhost:4000</code>, Meta cannot trigger delivery callbacks. As a result, delivery status updates (e.g., transition from <code>SENT</code> to <code>DELIVERED</code>) will not sync automatically.
          </li>
        </ul>
      </div>
    </div>
  );
}
