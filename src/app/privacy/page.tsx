
import { Container } from '@/components/shared/container';
import { PageHeader } from '@/components/shared/page-header';
import { APP_NAME } from '@/lib/constants';

export default function PrivacyPolicyPage() {
  return (
    <Container className="py-8 md:py-12">
      <PageHeader
        title="Privacy Policy"
        description={`Welcome to ${APP_NAME} (the "Platform"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site.`}
      />

      <div className="prose prose-lg max-w-none dark:prose-invert text-muted-foreground leading-relaxed">
        <p><strong>Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong></p>

        <p>
          This policy outlines our practices regarding the collection, use, and protection of your personal information. We are committed to protecting your privacy and ensuring that your personal data is handled in a safe and responsible manner.
        </p>

        <h2>1. Information We Collect</h2>
        <p>
          We may collect information about you in a variety of ways. The information we may collect on the Platform includes:
        </p>
        <h3>Personal Data</h3>
        <p>
          Personally identifiable information, such as your name and email address, that you voluntarily give to us when you register with the Platform or when you choose to participate in various activities related to the Platform, such as suggesting edits or content. You are under no obligation to provide us with personal information of any kind; however, your refusal to do so may prevent you from using certain features of the Platform.
        </p>
        <h3>Derivative Data</h3>
        <p>
          Information our servers automatically collect when you access the Platform, such as your IP address, your browser type, your operating system, your access times, and the pages you have viewed directly before and after accessing the Platform. This information is used for analytical purposes and to improve the Platform.
        </p>
        
        <h2>2. Use of Your Information</h2>
        <p>
          Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Platform to:
        </p>
        <ul>
          <li>Create and manage your account.</li>
          <li>Email you regarding your account or suggestions.</li>
          <li>Enable user-to-user communications (if such features are implemented).</li>
          <li>Process and manage suggestions and contributions you make.</li>
          <li>Monitor and analyze usage and trends to improve your experience with the Platform.</li>
          <li>Notify you of updates to the Platform or changes to our policies.</li>
          <li>Request feedback and contact you about your use of the Platform.</li>
          <li>Resolve disputes and troubleshoot problems.</li>
        </ul>

        <h2>3. Disclosure of Your Information</h2>
        <p>
          We may share information we have collected about you in certain situations. Your information may be disclosed as follows:
        </p>
        <h3>By Law or to Protect Rights</h3>
        <p>
          If we believe the release of information about you is necessary to respond to legal process, to investigate or remedy potential violations of our policies, or to protect the rights, property, and safety of others, we may share your information as permitted or required by any applicable law, rule, or regulation.
        </p>
        <h3>Third-Party Service Providers</h3>
        <p>
          We may share your information with third parties that perform services for us or on our behalf, including data analysis, email delivery, hosting services, customer service, and marketing assistance. (Currently, as a demo app, we do not use such third-party services for PII beyond what might be used by a hosting provider like Vercel for operational purposes).
        </p>
        <h3>Aggregated or Anonymized Data</h3>
        <p>
          We may share aggregated or anonymized information with third parties for research, analysis, or other purposes, provided this information does not identify you personally.
        </p>

        <h2>4. Security of Your Information</h2>
        <p>
          We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse. Any information disclosed online is vulnerable to interception and misuse by unauthorized parties. Therefore, we cannot guarantee complete security if you provide personal information.
        </p>

        <h2>5. Policy for Children</h2>
        <p>
          We do not knowingly solicit information from or market to children under the age of 13 (or the relevant age in your jurisdiction). If you become aware of any data we have collected from children under age 13, please contact us using the contact information provided below.
        </p>
        
        <h2>6. Your Data Rights</h2>
        <p>
            You have the right to access, correct, or delete your personal information. You may also have the right to restrict or object to certain processing of your data. To exercise these rights, please contact us. (For this demo application, user account management features are limited).
        </p>

        <h2>7. Changes to This Privacy Policy</h2>
        <p>
            We may update this Privacy Policy from time to time in order to reflect, for example, changes to our practices or for other operational, legal, or regulatory reasons. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
        </p>

        <h2>8. Contact Us</h2>
        <p>
          If you have questions or comments about this Privacy Policy, please contact us at:
        </p>
        <p>
          The {APP_NAME} Team<br />
          Email: privacy@{APP_NAME.toLowerCase().replace(/\s+/g, '')}.np (Placeholder)<br />
          {/* Address: 123 Transparency Lane, Kathmandu, Nepal (Placeholder) */}
        </p>
      </div>
    </Container>
  );
}
