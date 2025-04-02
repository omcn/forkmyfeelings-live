export default function PrivacyPolicy() {
    return (
      <div className="min-h-screen p-6 bg-white text-gray-800 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        <p className="mb-4">
          This Privacy Policy explains how Fork My Feels collects, uses, and protects your personal information.
        </p>
        <p className="mb-4">
          By using this website or app, you agree to the terms of this Privacy Policy.
        </p>
  
        <h2 className="text-xl font-semibold mt-6 mb-2">1. What We Collect</h2>
        <ul className="list-disc pl-6 mb-4">
          <li>Email address (for login)</li>
          <li>Mood selections</li>
          <li>Recipe interaction history</li>
        </ul>
  
        <h2 className="text-xl font-semibold mt-6 mb-2">2. How We Use It</h2>
        <p className="mb-4">
          Your data helps us improve recommendations and personalize your experience.
        </p>
  
        <h2 className="text-xl font-semibold mt-6 mb-2">3. Your Rights</h2>
        <p className="mb-4">
          You can request deletion of your data at any time using the in-app “Delete Account” option.
        </p>
  
        <h2 className="text-xl font-semibold mt-6 mb-2">4. Data Storage</h2>
        <p className="mb-4">
          Data is stored securely on Supabase. We use modern security standards to protect it.
        </p>
  
        <h2 className="text-xl font-semibold mt-6 mb-2">5. Contact</h2>
        <p className="mb-4">
          If you have any concerns, reach out to: <a className="text-pink-600 underline" href="mailto:hello@forkmyfeelings.com">hello@forkmyfeelings.com</a>
        </p>
      </div>
    );
  }
  