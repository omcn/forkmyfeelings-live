export const metadata = {
  title: "Privacy Policy",
  description: "Fork My Feels privacy policy — how we collect, use, and protect your data.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-100 to-orange-100 flex flex-col items-center px-6 py-12">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl w-full">
        <a href="/" className="text-pink-500 hover:text-pink-700 text-sm font-semibold mb-4 inline-block">&larr; Back to app</a>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-6">Last updated: March 2026</p>

        <section className="space-y-6 text-gray-700 text-sm leading-relaxed">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Information We Collect</h2>
            <p>When you use Fork My Feels, we may collect the following information:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>Account information:</strong> Email address, username, and profile photo you choose to provide.</li>
              <li><strong>Usage data:</strong> Mood selections, recipe ratings, cooking history, and saved recipes to personalise your experience.</li>
              <li><strong>Photos:</strong> Images you voluntarily capture and share via the recipe post feature. These are stored in our cloud storage.</li>
              <li><strong>Location data:</strong> Only when you use the "Eating Out" feature, and only with your explicit permission. We do not store your location.</li>
              <li><strong>Device information:</strong> Basic device type for responsive design. We do not collect device identifiers.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">2. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>To provide personalised recipe suggestions based on your mood and ratings.</li>
              <li>To enable social features (friend connections, feed posts, reactions).</li>
              <li>To display leaderboards and community content.</li>
              <li>To send push notifications if you opt in (e.g., cooking timer alerts, daily reminders).</li>
              <li>To improve the app experience through aggregated, anonymised usage patterns.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">3. Data Storage & Security</h2>
            <p>Your data is stored securely using Supabase, which provides encrypted data storage and secure authentication. Photos are stored in Supabase Storage with access controls. We use HTTPS for all data transmission.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Third-Party Services</h2>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Supabase:</strong> Authentication, database, and file storage.</li>
              <li><strong>Google Maps API:</strong> Restaurant suggestions when using the Eating Out feature (location data is sent to Google only when you use this feature).</li>
              <li><strong>Vercel:</strong> Hosting and content delivery.</li>
            </ul>
            <p className="mt-2">We do not sell your data to any third parties.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Your Rights</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>You can view and edit your profile information at any time.</li>
              <li>You can delete your account and all associated data from the Profile page.</li>
              <li>You can revoke camera and location permissions through your device settings.</li>
              <li>You can opt out of push notifications at any time.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Children's Privacy</h2>
            <p>Fork My Feels is not directed at children under 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">7. Changes to This Policy</h2>
            <p>We may update this policy from time to time. We will notify users of significant changes through the app. Continued use after changes constitutes acceptance.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">8. Contact Us</h2>
            <p>If you have questions about this privacy policy, please contact us at <a href="mailto:hello@forkmyfeelings.com" className="text-pink-600 underline">hello@forkmyfeelings.com</a>.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
