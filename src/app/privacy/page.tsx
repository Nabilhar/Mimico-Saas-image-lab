export default function PrivacyPolicy() {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
            <p className="text-gray-600">
              <strong>Shoreline Studio</strong>
            </p>
            <p className="text-sm text-gray-500 mt-2">
              <strong>Effective Date:</strong> May 14, 2026<br />
              <strong>Last Updated:</strong> May 14, 2026
            </p>
          </div>
  
          {/* Content */}
          <div className="bg-white rounded-lg shadow-sm p-8 prose prose-lg max-w-none">
            
            {/* Introduction */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Introduction</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Welcome to Shoreline Studio ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website at shorelinestudio.ca and our AI-powered content generation services (collectively, the "Service").
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                This Privacy Policy complies with the Personal Information Protection and Electronic Documents Act (PIPEDA) and other applicable Canadian privacy laws.
              </p>
              <p className="text-gray-700 leading-relaxed font-semibold">
                By using our Service, you agree to the collection and use of information in accordance with this Privacy Policy.
              </p>
            </section>
  
            {/* 1. Information We Collect */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                We collect several types of information from and about users of our Service.
              </p>
  
              <h3 className="text-xl font-semibold text-gray-800 mb-3">1.1 Personal Information You Provide</h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                When you register for an account or use our Service, we collect:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                <li><strong>Account Information:</strong> Email address, password (encrypted), name</li>
                <li><strong>Business Information:</strong> Business name, street address, city, province/state, country, postal code, business category, business niche</li>
                <li><strong>Payment Information:</strong> If you purchase credits, payment details are processed by our third-party payment processor (Stripe). We do not store full credit card numbers on our servers</li>
                <li><strong>User Content:</strong> Social media posts you generate, images you create, photos you upload for brand discovery</li>
                <li><strong>Communication Data:</strong> Messages you send to our support team</li>
              </ul>
  
              <h3 className="text-xl font-semibold text-gray-800 mb-3">1.2 Information Automatically Collected</h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                When you access our Service, we automatically collect:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                <li><strong>Device Information:</strong> IP address, browser type, operating system, device identifiers</li>
                <li><strong>Usage Data:</strong> Pages visited, features used, time spent on pages, clicks, post generation frequency</li>
                <li><strong>Cookies and Similar Technologies:</strong> We use cookies to maintain your session and improve user experience (see Section 9)</li>
              </ul>
  
              <h3 className="text-xl font-semibold text-gray-800 mb-3">1.3 Information From Third Parties</h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                We receive information from:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Authentication Provider (Clerk):</strong> User ID, email address, authentication status</li>
                <li><strong>AI Service Providers:</strong> When you use our content generation features, we send your business information to Anthropic (Claude), Google (Gemini), Groq, and OpenRouter to generate content. These providers process your data according to their own privacy policies but do not retain your data after processing.</li>
              </ul>
            </section>
  
            {/* 2. How We Use Your Information */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How We Use Your Information</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                We use the information we collect to:
              </p>
  
              <h3 className="text-xl font-semibold text-gray-800 mb-3">2.1 Provide and Improve the Service</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                <li>Create and manage your account</li>
                <li>Generate AI-powered social media content based on your business profile</li>
                <li>Perform brand discovery analysis (visual and text-based)</li>
                <li>Process credit purchases and manage your account balance</li>
                <li>Store your generated posts and images in your content library</li>
                <li>Provide customer support and respond to your inquiries</li>
              </ul>
  
              <h3 className="text-xl font-semibold text-gray-800 mb-3">2.2 Communicate With You</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                <li>Send service-related emails (account verification, password resets, credit purchase confirmations)</li>
                <li>Notify you of important changes to our Service or policies</li>
                <li>Send promotional emails about new features or special offers (you can opt out at any time)</li>
              </ul>
  
              <h3 className="text-xl font-semibold text-gray-800 mb-3">2.3 Analytics and Improvements</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                <li>Analyze usage patterns to improve our Service</li>
                <li>Monitor and prevent fraud, abuse, or technical issues</li>
                <li>Conduct research and development for new features</li>
                <li>Ensure compliance with our Terms of Service</li>
              </ul>
  
              <h3 className="text-xl font-semibold text-gray-800 mb-3">2.4 Legal Compliance</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Comply with legal obligations under Canadian and international law</li>
                <li>Protect our rights, property, and safety, and that of our users</li>
                <li>Respond to legal requests from law enforcement or government authorities</li>
              </ul>
            </section>
  
            {/* 3. How We Share Your Information */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Share Your Information</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                We do not sell, rent, or trade your personal information. We share your information only in the following limited circumstances:
              </p>
  
              <h3 className="text-xl font-semibold text-gray-800 mb-3">3.1 Service Providers</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We share information with third-party service providers who perform services on our behalf:
              </p>
              
              <div className="overflow-x-auto mb-6">
                <table className="min-w-full border border-gray-300">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700">Service Provider</th>
                      <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700">Purpose</th>
                      <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700">Data Shared</th>
                      <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700">Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700"><strong>Clerk</strong></td>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">Authentication</td>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">Email, user ID</td>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">United States</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700"><strong>Supabase</strong></td>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">Database and storage</td>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">All account and business data</td>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">United States</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700"><strong>Anthropic</strong></td>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">Content generation (Claude AI)</td>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">Business info, generation prompts</td>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">United States</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700"><strong>Google</strong></td>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">Vision analysis & image generation (Gemini)</td>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">Photos, business data, image prompts</td>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">United States</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700"><strong>Groq</strong></td>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">Prompt optimization</td>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">Business data, post content</td>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">United States</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700"><strong>OpenRouter</strong></td>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">AI routing</td>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">Business data, generation prompts</td>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">United States</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700"><strong>Vercel</strong></td>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">Hosting and deployment</td>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">Usage logs, IP addresses</td>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">United States</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700"><strong>Stripe</strong> (future)</td>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">Payment processing</td>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">Payment info, email</td>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">United States</td>
                    </tr>
                  </tbody>
                </table>
              </div>
  
              <p className="text-gray-700 leading-relaxed mb-6 font-semibold">
                Important: These service providers are contractually obligated to use your information only to provide services to us and are prohibited from using it for their own purposes.
              </p>
  
              <h3 className="text-xl font-semibold text-gray-800 mb-3">3.2 Business Transfers</h3>
              <p className="text-gray-700 leading-relaxed mb-6">
                If Shoreline Studio is involved in a merger, acquisition, or sale of assets, your personal information may be transferred. We will notify you via email and/or a prominent notice on our website of any change in ownership or use of your personal information.
              </p>
  
              <h3 className="text-xl font-semibold text-gray-800 mb-3">3.3 Legal Requirements</h3>
              <p className="text-gray-700 leading-relaxed mb-6">
                We may disclose your information if required to do so by law or in response to valid requests by public authorities (e.g., a court order, subpoena, or government investigation).
              </p>
  
              <h3 className="text-xl font-semibold text-gray-800 mb-3">3.4 Protection of Rights</h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                We may disclose information to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Enforce our Terms of Service</li>
                <li>Protect the security or integrity of our Service</li>
                <li>Protect the rights, property, or safety of Shoreline Studio, our users, or the public</li>
              </ul>
            </section>
  
            {/* 4. Data Retention */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Data Retention</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4 font-semibold">
                Specific Retention Periods:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                <li><strong>Account Information:</strong> Retained while your account is active and for 30 days after account deletion (to prevent accidental data loss)</li>
                <li><strong>Generated Content:</strong> Retained indefinitely unless you manually delete posts from your library</li>
                <li><strong>Usage Logs:</strong> Retained for 90 days</li>
                <li><strong>Payment Records:</strong> Retained for 7 years (as required by Canadian tax law)</li>
                <li><strong>Support Communications:</strong> Retained for 2 years after case closure</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-3 font-semibold">
                After Deletion:
              </p>
              <p className="text-gray-700 leading-relaxed mb-3">
                When you request account deletion, we will:
              </p>
              <ol className="list-decimal pl-6 space-y-2 text-gray-700">
                <li>Immediately deactivate your account</li>
                <li>Delete your personal information within 30 days</li>
                <li>Retain only anonymous usage statistics that cannot identify you</li>
                <li>Permanently delete all generated content, images, and business profiles</li>
              </ol>
            </section>
  
            {/* 5. Data Security */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Security</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4 font-semibold">
                Security Measures Include:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                <li><strong>Encryption:</strong> All data in transit is encrypted using TLS/SSL. Passwords are encrypted using industry-standard hashing algorithms (bcrypt).</li>
                <li><strong>Access Controls:</strong> Only authorized personnel have access to personal information, and only to the extent necessary for their job functions.</li>
                <li><strong>Secure Storage:</strong> Data is stored on Supabase's secure cloud infrastructure with regular backups.</li>
                <li><strong>Row-Level Security:</strong> Database access is controlled via Supabase Row Level Security (RLS) policies ensuring users can only access their own data.</li>
                <li><strong>Regular Security Audits:</strong> We conduct periodic security reviews and vulnerability assessments.</li>
              </ul>
              <p className="text-gray-700 leading-relaxed font-semibold">
                However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to protect your personal information, we cannot guarantee its absolute security.
              </p>
            </section>
  
            {/* 6. Your Privacy Rights */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Your Privacy Rights (Canadian Users)</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Under PIPEDA and other Canadian privacy laws, you have the following rights:
              </p>
  
              <h3 className="text-xl font-semibold text-gray-800 mb-3">6.1 Right to Access</h3>
              <p className="text-gray-700 leading-relaxed mb-6">
                You have the right to request access to the personal information we hold about you. We will provide you with a copy of your data in a commonly used electronic format.
              </p>
  
              <h3 className="text-xl font-semibold text-gray-800 mb-3">6.2 Right to Correction</h3>
              <p className="text-gray-700 leading-relaxed mb-6">
                You have the right to request correction of any inaccurate or incomplete personal information. You can update most information directly in your profile settings.
              </p>
  
              <h3 className="text-xl font-semibold text-gray-800 mb-3">6.3 Right to Deletion</h3>
              <p className="text-gray-700 leading-relaxed mb-6">
                You have the right to request deletion of your personal information, subject to certain legal exceptions (e.g., records we must retain for tax purposes).
              </p>
  
              <h3 className="text-xl font-semibold text-gray-800 mb-3">6.4 Right to Data Portability</h3>
              <p className="text-gray-700 leading-relaxed mb-6">
                You have the right to receive your personal information in a structured, commonly used, machine-readable format and to transmit that data to another service provider.
              </p>
  
              <h3 className="text-xl font-semibold text-gray-800 mb-3">6.5 Right to Withdraw Consent</h3>
              <p className="text-gray-700 leading-relaxed mb-6">
                Where we rely on your consent to process your personal information, you have the right to withdraw that consent at any time. This will not affect the lawfulness of processing before withdrawal.
              </p>
  
              <h3 className="text-xl font-semibold text-gray-800 mb-3">6.6 Right to Object</h3>
              <p className="text-gray-700 leading-relaxed mb-6">
                You have the right to object to our processing of your personal information for direct marketing purposes.
              </p>
  
              <h3 className="text-xl font-semibold text-gray-800 mb-3">6.7 Right to Lodge a Complaint</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you believe we have not complied with Canadian privacy laws, you have the right to lodge a complaint with the Office of the Privacy Commissioner of Canada:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                <li>Website: https://www.priv.gc.ca</li>
                <li>Phone: 1-800-282-1376</li>
              </ul>
  
              <p className="text-gray-700 leading-relaxed font-semibold">
                To Exercise Your Rights:
              </p>
              <p className="text-gray-700 leading-relaxed">
                Email us at <a href="mailto:contact@shorelinestudio.ca" className="text-blue-600 hover:underline">contact@shorelinestudio.ca</a> with your request. We will respond within 30 days.
              </p>
            </section>
  
            {/* 7. International Data Transfers */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. International Data Transfers</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Your information may be transferred to, and maintained on, servers located outside of Canada, including in the United States, where our service providers (Clerk, Supabase, Anthropic, Google, Vercel) operate.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4 font-semibold">
                Important Considerations:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                <li>Data protection laws in the United States may differ from those in Canada</li>
                <li>When we transfer your personal information, we ensure appropriate safeguards are in place (e.g., contractual obligations requiring compliance with privacy standards)</li>
                <li>By using our Service, you consent to the transfer of your information to the United States</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                If you are located in the European Economic Area (EEA), we rely on Standard Contractual Clauses approved by the European Commission for data transfers.
              </p>
            </section>
  
            {/* 8. Children's Privacy */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Children's Privacy</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Our Service is not intended for individuals under the age of 18. We do not knowingly collect personal information from children under 18.
              </p>
              <p className="text-gray-700 leading-relaxed">
                If you are a parent or guardian and believe your child has provided us with personal information, please contact us at <a href="mailto:contact@shorelinestudio.ca" className="text-blue-600 hover:underline">contact@shorelinestudio.ca</a>. We will delete such information from our systems within 30 days.
              </p>
            </section>
  
            {/* 9. Cookies */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Cookies and Tracking Technologies</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                We use cookies and similar tracking technologies to enhance your experience on our Service.
              </p>
  
              <h3 className="text-xl font-semibold text-gray-800 mb-3">9.1 What Are Cookies?</h3>
              <p className="text-gray-700 leading-relaxed mb-6">
                Cookies are small text files stored on your device by your web browser. They help websites remember information about your visit.
              </p>
  
              <h3 className="text-xl font-semibold text-gray-800 mb-3">9.2 Types of Cookies We Use</h3>
              <div className="overflow-x-auto mb-6">
                <table className="min-w-full border border-gray-300">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700">Cookie Type</th>
                      <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700">Purpose</th>
                      <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700"><strong>Essential Cookies</strong></td>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">Required for authentication and core functionality</td>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">Session (deleted when you close browser)</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700"><strong>Preference Cookies</strong></td>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">Remember your settings (e.g., voice selection)</td>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">Persistent (up to 1 year)</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700"><strong>Analytics Cookies</strong> (future)</td>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">Understand how users interact with our Service</td>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">Persistent (up to 2 years)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
  
              <h3 className="text-xl font-semibold text-gray-800 mb-3">9.3 Managing Cookies</h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                You can control cookies through your browser settings:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li><strong>Chrome:</strong> Settings &gt; Privacy and Security &gt; Cookies</li>
                <li><strong>Firefox:</strong> Settings &gt; Privacy & Security &gt; Cookies</li>
                <li><strong>Safari:</strong> Preferences &gt; Privacy &gt; Cookies</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-6 font-semibold">
                Note: Disabling essential cookies may affect your ability to use certain features of our Service.
              </p>
  
              <h3 className="text-xl font-semibold text-gray-800 mb-3">9.4 Third-Party Cookies</h3>
              <p className="text-gray-700 leading-relaxed">
                We currently do not use third-party cookies for advertising. If we introduce analytics tools (e.g., Google Analytics) in the future, we will update this policy and provide you with opt-out options.
              </p>
            </section>
  
            {/* 10. Third-Party Links */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Third-Party Links</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Our Service may contain links to third-party websites or services (e.g., social media platforms where you post your generated content).
              </p>
              <p className="text-gray-700 leading-relaxed font-semibold">
                We are not responsible for the privacy practices of these third parties. We encourage you to review the privacy policies of any third-party sites you visit.
              </p>
            </section>
  
            {/* 11. AI and Automated Decision-Making */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. AI and Automated Decision-Making</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Our Service uses AI (Anthropic Claude, Google Gemini) to generate social media content. Here's what you should know:
              </p>
  
              <h3 className="text-xl font-semibold text-gray-800 mb-3">11.1 How AI is Used</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                <li><strong>Content Generation:</strong> AI analyzes your business profile and generates text posts based on templates and cognitive patterns</li>
                <li><strong>Image Generation:</strong> AI creates images based on your brand colors and aesthetic preferences</li>
                <li><strong>Brand Discovery:</strong> AI analyzes your uploaded photos to extract visual identity and researches your business online</li>
              </ul>
  
              <h3 className="text-xl font-semibold text-gray-800 mb-3">11.2 Human Oversight</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                <li>You have full control over what content is saved and published</li>
                <li>You can regenerate content if the AI output is unsatisfactory</li>
                <li>Our support team can review and address AI-generated content concerns</li>
              </ul>
  
              <h3 className="text-xl font-semibold text-gray-800 mb-3">11.3 No Automated Decisions Affecting Rights</h3>
              <p className="text-gray-700 leading-relaxed">
                We do not use AI to make automated decisions that significantly affect your legal rights or contractual obligations.
              </p>
            </section>
  
            {/* 12. California Privacy Rights */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. California Privacy Rights (CCPA)</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA):
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li><strong>Right to Know:</strong> Request disclosure of personal information collected, used, or shared</li>
                <li><strong>Right to Delete:</strong> Request deletion of personal information</li>
                <li><strong>Right to Opt-Out:</strong> Opt-out of the sale of personal information (Note: We do not sell personal information)</li>
                <li><strong>Right to Non-Discrimination:</strong> We will not discriminate against you for exercising your CCPA rights</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                To exercise these rights, email <a href="mailto:contact@shorelinestudio.ca" className="text-blue-600 hover:underline">contact@shorelinestudio.ca</a>.
              </p>
            </section>
  
            {/* 13. European Privacy Rights */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. European Privacy Rights (GDPR)</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                If you are located in the European Economic Area (EEA), you have rights under the General Data Protection Regulation (GDPR):
              </p>
  
              <h3 className="text-xl font-semibold text-gray-800 mb-3">13.1 Legal Basis for Processing</h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                We process your personal information based on:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                <li><strong>Contractual Necessity:</strong> To provide the Service you requested</li>
                <li><strong>Legitimate Interests:</strong> To improve our Service and prevent fraud</li>
                <li><strong>Consent:</strong> For optional features like marketing emails</li>
              </ul>
  
              <h3 className="text-xl font-semibold text-gray-800 mb-3">13.2 Additional GDPR Rights</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                <li>Right to restriction of processing</li>
                <li>Right to data portability</li>
                <li>Right to object to processing</li>
                <li>Right to withdraw consent at any time</li>
              </ul>
  
              <h3 className="text-xl font-semibold text-gray-800 mb-3">13.3 Data Protection Officer</h3>
              <p className="text-gray-700 leading-relaxed">
                For GDPR-related inquiries, contact our Data Protection Officer at <a href="mailto:contact@shorelinestudio.ca" className="text-blue-600 hover:underline">contact@shorelinestudio.ca</a>.
              </p>
            </section>
  
            {/* 14. Changes to This Privacy Policy */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Changes to This Privacy Policy</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                We may update this Privacy Policy from time to time to reflect changes in our practices or for legal, regulatory, or operational reasons.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4 font-semibold">
                We will notify you of material changes by:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                <li>Posting the updated policy on this page</li>
                <li>Updating the "Last Updated" date</li>
                <li>Sending an email notification (for significant changes)</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4 font-semibold">
                Your continued use of the Service after changes become effective constitutes acceptance of the updated Privacy Policy.
              </p>
              <p className="text-gray-700 leading-relaxed">
                We encourage you to review this Privacy Policy periodically.
              </p>
            </section>
  
            {/* 15. Contact Us */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">15. Contact Us</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have questions, concerns, or requests regarding this Privacy Policy or our privacy practices, please contact us:
              </p>
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <p className="text-gray-700 mb-2"><strong>Shoreline Studio</strong></p>
                <p className="text-gray-700 mb-2">Email: <a href="mailto:contact@shorelinestudio.ca" className="text-blue-600 hover:underline">contact@shorelinestudio.ca</a></p>
                <p className="text-gray-700">Address: Toronto, Ontario, Canada</p>
              </div>
              <p className="text-gray-700 leading-relaxed mt-4 font-semibold">
                Response Time: We will respond to privacy inquiries within 30 days.
              </p>
            </section>
  
            {/* 16. Consent */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">16. Consent</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                By using Shoreline Studio, you consent to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                <li>The collection, use, and disclosure of your personal information as described in this Privacy Policy</li>
                <li>The transfer of your information to service providers located outside Canada, including in the United States</li>
                <li>The use of cookies and tracking technologies as described in this Privacy Policy</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4 font-semibold">
                You may withdraw your consent at any time by:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Deleting your account (contact <a href="mailto:contact@shorelinestudio.ca" className="text-blue-600 hover:underline">contact@shorelinestudio.ca</a>)</li>
                <li>Opting out of marketing emails (click "unsubscribe" in any promotional email)</li>
                <li>Disabling cookies in your browser settings</li>
              </ul>
            </section>
  
            {/* Footer */}
            <div className="border-t border-gray-300 pt-8 mt-12">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Last Updated:</strong> May 14, 2026
              </p>
              <p className="text-sm text-gray-600 mb-4">
                <strong>Effective Date:</strong> May 14, 2026
              </p>
              <p className="text-xs text-gray-500 italic">
                This Privacy Policy was prepared in accordance with Canadian privacy laws, including PIPEDA, as well as international standards including GDPR and CCPA. If you have concerns about our privacy practices, you may contact the Office of the Privacy Commissioner of Canada at 1-800-282-1376 or www.priv.gc.ca.
              </p>
            </div>
  
          </div>
        </div>
      </div>
    );
  }