import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import Screen from '../../components/Screen';
import { COLORS, FONTS, SPACING } from '../../constants/theme';

export const CURRENT_TERMS_VERSION = '2026-10-19-v1';

const DOCUMENTS = {
  Terms: {
    title: 'Terms of Service',
    updated: 'Draft • Effective date to be confirmed',
    intro: 'These Terms of Service describe the rules for using LingoBridge. By creating an account or using the service, you agree to these terms. Please review them before continuing.',
    sections: [
      ['1. About LingoBridge', 'LingoBridge provides English learning and practice features, including lessons, exercises, progress tracking, IELTS practice, and AI assisted feedback. The service and its features may change over time. The organization or person legally providing LingoBridge and its contact details must be identified here before publication.'],
      ['2. Eligibility and your account', 'You must provide accurate account information, keep your password confidential, and tell us promptly if you believe someone has accessed your account without permission. You are responsible for activity under your account. Do not create an account if you are not legally able to agree to these terms. Any age restrictions and rules for users under 18 must be confirmed for the regions where LingoBridge operates.'],
      ['3. Acceptable use', 'Use LingoBridge lawfully and respectfully. Do not disrupt or probe the service, bypass access or usage limits, impersonate another person, upload unlawful or harmful material, or use the service to infringe another person’s rights. We may restrict access when reasonably necessary to protect users, the service, or others, subject to applicable law.'],
      ['4. Learning content and AI features', 'Learning materials and AI generated explanations, exercises, translations, and feedback are provided for educational purposes. They may be incomplete or incorrect and are not professional, official, or guaranteed advice or results. Check important information independently. Do not submit sensitive personal information in prompts. Your use of AI features may involve sending prompt content to the AI provider configured for the service.'],
      ['5. Your content', 'You retain rights you have in content you submit. You allow LingoBridge to host and process that content as needed to operate, secure, and provide the features you use. Do not submit content unless you have the rights and permission needed to do so. The scope, duration, and any additional uses of this permission should be confirmed by the service operator before publication.'],
      ['6. Availability and changes', 'We work to keep LingoBridge available, but do not promise uninterrupted or error free operation. Features may be changed, suspended, or discontinued. We will provide any notices required by applicable law.'],
      ['7. Suspension and account closure', 'You can stop using LingoBridge and request account closure through the support contact listed below. We may suspend or close accounts for serious or repeated violations, security reasons, or where required by law. Explain the account deletion process, retention exceptions, and any appeal route here before launch.'],
      ['8. Disclaimers and liability', 'To the extent permitted by law, LingoBridge is provided without guarantees that every feature will meet your needs or that learning outcomes will be achieved. Nothing in these terms limits rights or remedies that cannot legally be limited. Any permitted limits on liability, governing law, and dispute process must be completed by qualified counsel for the places where the service is offered.'],
      ['9. Updates and contact', 'We may update these terms and will provide notice when required. The effective date above should be updated whenever a new version takes effect. Questions or requests: add the service operator’s legal name, mailing address, and support email before publishing.'],
    ],
  },
  Privacy: {
    title: 'Privacy Policy',
    updated: 'Draft • Effective date to be confirmed',
    intro: 'This draft explains the personal information LingoBridge handles based on the current app features. The service operator must verify it against production systems, vendors, and applicable privacy laws before publication.',
    sections: [
      ['1. Who is responsible', 'The organization or person operating LingoBridge is responsible for personal information described here. Add its legal name, address, privacy contact, and applicable regional representative details before launch.'],
      ['2. Information the app handles', 'Account information includes your name, email address, password credentials, date of birth, and optional phone number. Learning information may include your goals, level, preferences, practice answers, IELTS work, progress, and settings. The service also processes technical and security information needed to authenticate accounts, operate features, prevent abuse, and diagnose problems. Confirm production logs, analytics, crash reporting, and device data before publication.'],
      ['3. AI conversations and assessments', 'When you use AI features, the text you submit and the generated response may be processed by the AI provider configured for LingoBridge. The app has a “Save my AI conversations” setting. When enabled, conversation text and AI interaction records may be stored with your account. When disabled, the current app is designed not to store conversation text for new interactions, though request and service activity may still be recorded. Review the setting description in Privacy & Security for details. Confirm provider names, provider retention and training practices, and any transfers before launch.'],
      ['4. How information is used', 'Information is used to create and secure accounts, provide learning and AI features, save progress and preferences, respond to support requests, maintain and improve the service, and meet legal obligations. Do not claim additional purposes unless they are actually used and disclosed.'],
      ['5. Sharing and service providers', 'Information may be processed by vendors that help host the service, send account emails, or provide AI features. The current deployment configuration determines which vendors receive information. Add the providers, their purposes, locations, and links to their privacy information before publication. Information may also be disclosed when required by law or to protect users and the service.'],
      ['6. Retention and deletion', 'We keep information for as long as needed to provide the service and for legitimate operational, security, and legal purposes. The app currently offers data export and controls to clear AI conversation history and practice history; some totals or service records may remain. Set and disclose specific retention periods, account deletion steps, backup handling, and exceptions before launch.'],
      ['7. Your choices and rights', 'You can manage AI conversation saving in Privacy & Security and use the available data export and history controls. Depending on where you live, you may also have rights to access, correct, delete, restrict, or object to processing, or to complain to a privacy regulator. Contact the privacy contact above to make a request. The responsible operator should confirm response timelines and identity checks.'],
      ['8. Security and international processing', 'We use measures intended to protect information, but no system can be guaranteed completely secure. Vendors may process information in countries other than yours. Identify hosting and AI processing locations, safeguards for international transfers, and the security measures that can accurately be described before publication.'],
      ['9. Children and age requirements', 'LingoBridge collects date of birth and applies age checks to certain IELTS features. This draft does not establish whether the service is intended for children or what parental consent rules apply. Confirm minimum age, child privacy practices, and regional requirements before accepting users.'],
      ['10. Changes and contact', 'We may update this policy and will provide notice when required. Update the effective date when a new version takes effect. For privacy questions or requests, add the operator’s legal name and privacy contact email before publishing.'],
    ],
  },
};

const LegalDocumentScreen = ({ route }) => {
  const document = DOCUMENTS[route?.params?.document] || DOCUMENTS.Terms;
  return (
    <Screen title={document.title}>
      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>Review draft</Text>
        <Text style={styles.noticeText}>This draft needs review and completion by the LingoBridge operator and qualified counsel before it is treated as a final legal policy.</Text>
      </View>
      <Text style={styles.updated}>{document.updated}</Text>
      <Text style={styles.intro}>{document.intro}</Text>
      {document.sections.map(([heading, body]) => (
        <View key={heading} style={styles.section}>
          <Text style={styles.heading}>{heading}</Text>
          <Text style={styles.body}>{body}</Text>
        </View>
      ))}
    </Screen>
  );
};

const styles = StyleSheet.create({
  notice: { backgroundColor: COLORS.warningLight, borderRadius: 10, padding: SPACING.base, marginBottom: SPACING.base },
  noticeTitle: { ...FONTS.regular, fontWeight: '700', color: COLORS.warningTextStrong, marginBottom: SPACING.xs },
  noticeText: { ...FONTS.small, color: COLORS.warningTextStrong, lineHeight: 20 },
  updated: { ...FONTS.tiny, marginBottom: SPACING.md },
  intro: { ...FONTS.regular, lineHeight: 24, marginBottom: SPACING.lg },
  section: { marginBottom: SPACING.lg },
  heading: { ...FONTS.h4, marginBottom: SPACING.xs },
  body: { ...FONTS.regular, lineHeight: 24 },
});

export default LegalDocumentScreen;
