export const metadata = {
  title: "Terms of Service",
  description: "Fork My Feels terms of service — rules and guidelines for using our app.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-100 to-orange-100 flex flex-col items-center px-6 py-12">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl w-full">
        <a href="/" className="text-pink-500 hover:text-pink-700 text-sm font-semibold mb-4 inline-block">&larr; Back to app</a>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
        <p className="text-sm text-gray-400 mb-6">Last updated: March 2026</p>

        <section className="space-y-6 text-gray-700 text-sm leading-relaxed">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Acceptance of Terms</h2>
            <p>By accessing or using Fork My Feels ("the App"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the App.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">2. Description of Service</h2>
            <p>Fork My Feels is a mood-based recipe suggestion app that recommends recipes based on how you feel. The App includes social features such as posting cooking photos, friend connections, and community leaderboards.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">3. User Accounts</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>You must provide accurate information when creating an account.</li>
              <li>You are responsible for maintaining the security of your account credentials.</li>
              <li>You must be at least 13 years old to use the App.</li>
              <li>One account per person. Multiple accounts may be terminated.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">4. User Content</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>You retain ownership of photos and content you post.</li>
              <li>By posting content, you grant Fork My Feels a non-exclusive licence to display it within the App.</li>
              <li>Content must be family-friendly. Offensive, harmful, or inappropriate content will be removed.</li>
              <li>Recipe submissions are reviewed before appearing publicly.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Use the App for any illegal purpose.</li>
              <li>Post content that is offensive, discriminatory, or harmful.</li>
              <li>Attempt to access other users' accounts or private data.</li>
              <li>Use automated tools to scrape or interact with the App.</li>
              <li>Circumvent any security measures or rate limits.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Recipe Disclaimer</h2>
            <p>Recipes are user-submitted and community-curated. Fork My Feels does not guarantee the accuracy, safety, or nutritional value of any recipe. Users with allergies or dietary restrictions should exercise their own judgement. Always check ingredients for allergens.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">7. Termination</h2>
            <p>We reserve the right to suspend or terminate accounts that violate these terms. You may delete your account at any time from the Profile page, which will remove all your associated data.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">8. Limitation of Liability</h2>
            <p>Fork My Feels is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the App, including but not limited to food preparation outcomes, allergic reactions, or data loss.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">9. Changes to Terms</h2>
            <p>We may update these terms from time to time. Continued use of the App after changes constitutes acceptance of the new terms.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">10. Contact</h2>
            <p>Questions about these terms? Contact us at <a href="mailto:hello@forkmyfeelings.com" className="text-pink-600 underline">hello@forkmyfeelings.com</a>.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
