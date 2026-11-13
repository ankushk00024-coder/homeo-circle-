import React from 'react';
import { Link } from 'react-router-dom';
import { LegalDocument, P, UL, Note } from '../../legal/LegalDocument';
import { OPERATOR, op } from '../../legal/config';

const L: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => <Link to={to} className="text-teal-700 underline">{children}</Link>;

export const TermsPage: React.FC = () => (
  <LegalDocument
    doc="terms"
    intro={<>These Terms of Use are an agreement between you and {op(OPERATOR.legalName)}, which operates Homeo India. Please read them with the <L to="/privacy">Privacy Policy</L> and <L to="/community-rules">Community Guidelines</L>.</>}
    sections={[
      { id: 'acceptance', title: 'Acceptance', body: <P>By creating an account or using Homeo India you agree to these Terms. If you do not agree, do not use the service. If you use Homeo India for an organisation, you confirm you may accept these Terms for it.</P> },
      { id: 'about', title: 'What Homeo India is', body: (<>
        <P>Homeo India is an independent platform for academic learning, professional networking, educational discussion and knowledge sharing within the homoeopathic community.</P>
        <Note>Homeo India is not a government authority, statutory medical council, licensing body or medical registration authority. Membership, verification or a badge on Homeo India does not grant, renew or prove any registration or licence to practise.</Note>
      </>) },
      { id: 'eligibility', title: 'Who can join', body: (<>
        <P>You must be at least 18 years old and belong to one of the membership categories below. You must give true, current information.</P>
      </>) },
      { id: 'categories', title: 'Membership categories and your obligations', body: (<>
        <UL items={[
          <><strong>Registered Practitioner</strong> — you confirm that you are enrolled in a State or Central register of homoeopathy and that the registration details you give are true and current. You must tell us if your registration lapses, is suspended or is cancelled.</>,
          <><strong>BHMS Student</strong> — you confirm you are currently enrolled in a BHMS course. You are <em>not</em> required to be, and must not claim to be, a registered practitioner.</>,
          <><strong>Intern</strong> — you confirm you are doing your internship. Internship does not make you a registered practitioner; you must not present yourself as one.</>,
          <><strong>Qualified Graduate</strong> — you confirm you hold the qualification you state. Until your registration is verified you will not be shown, and must not present yourself, as a registered practitioner.</>,
          <><strong>Academic / Research Member</strong> — you confirm the academic or research role you state. You must not present yourself as a registered practitioner unless you are one and it has been verified.</>,
        ]} />
      </>) },
      { id: 'account', title: 'Your account', body: <P>Keep your password secret and your account to yourself. You are responsible for activity on your account. Tell us at once if you think someone else has used it. One person, one account.</P> },
      { id: 'verification', title: 'Verification', body: (<>
        <P>We review the information and documents you submit, as described in the <L to="/verification-policy">Verification Policy</L>. We may ask for more information, decline an application, or re-check membership later. A verified degree is not the same as a verified registration; the Registered Practitioner badge appears only after registration records have been checked.</P>
        <P>Verification reflects what we checked at a point in time. It is not a guarantee of anyone's competence, conduct or current status, and you should make your own checks before relying on another member professionally.</P>
      </>) },
      { id: 'responsibilities', title: 'Your responsibilities', body: <UL items={['Follow the Community Guidelines and applicable law.', 'Post only content you have the right to share.', 'Keep other members\' information private and use it only for the purpose it was shared.', 'Do not misuse the service, other members\' data or our systems.']} /> },
      { id: 'conduct', title: 'Professional conduct', body: <P>Members who are registered practitioners remain bound by the professional conduct and ethics rules that apply to them, including rules about advertising and professional communication. Homeo India does not change those obligations.</P> },
      { id: 'academic', title: 'Academic discussions', body: <P>Share opinions as opinions and cite sources for factual or research claims. Do not present unverified claims as established fact.</P> },
      { id: 'clinical', title: 'Clinical discussions', body: <P>Clinical discussions are for education between members. They are not consultations and must not be used to diagnose or treat any individual. Read the <L to="/clinical-disclaimer">Clinical Discussion Disclaimer</L>. Students and interns must not give independent clinical advice; mentorship on Homeo India does not authorise anyone to practise.</P> },
      { id: 'confidentiality', title: 'Patient confidentiality', body: <P>Never post a patient's name, contact details, ID numbers, photographs, records or any combination of details that could identify them, unless you have a valid legal basis and the patient's informed consent. Remove identifying details from all case descriptions.</P> },
      { id: 'prohibited', title: 'Prohibited activities', body: <UL items={['Impersonation, fake qualifications or registration claims, or misleading titles.', 'Harassment, threats, hate, abuse or defamation.', 'Spam, unsolicited advertising, fraud or scams.', 'Fabricated research or misrepresenting studies.', 'Sharing copyrighted material without permission.', 'Posting patient-identifiable or other confidential information.', 'Scraping, bulk-downloading member data, probing our security, or interfering with the service.', 'Anything illegal.']} /> },
      { id: 'ip', title: 'Copyright and intellectual property', body: <P>You keep ownership of what you post. You give Homeo India a non-exclusive, royalty-free licence to host, display and distribute it on the service for as long as it stays on the service. The Homeo India name, logo and site design belong to the operator. See the <L to="/copyright">Copyright Policy</L>.</P> },
      { id: 'research', title: 'Research contributions', body: <P>When you share research, give accurate citations (authors, journal or publisher, date, DOI or link) and state its licence. Upload full texts only if they are open access, shared with permission, or your own work; otherwise share a summary and a link.</P> },
      { id: 'events', title: 'Events and webinars', body: <P>Events are academic activities. Unless an event page states a confirmed accreditation, events do not carry CME or other credits, and attending any event does not create registration or licensing rights. Organisers are responsible for their events' content.</P> },
      { id: 'advertising', title: 'Advertising and sponsorship', body: <P>Homeo India does not currently show advertising. Members may not advertise on the platform without our written permission. If sponsored content is introduced, it will be clearly labelled.</P> },
      { id: 'suspension', title: 'Suspension', body: <P>We may remove content or suspend an account temporarily if it breaks these Terms or the Community Guidelines, or if we need to protect members or comply with law. Where reasonable, we will tell you why.</P> },
      { id: 'termination', title: 'Termination', body: <P>You can stop using Homeo India and ask us to delete your account at any time. We may close accounts for serious or repeated breaches, false information, or where required by law. Sections that by their nature should continue (for example intellectual property, disclaimers and liability) survive termination.</P> },
      { id: 'reporting', title: 'Reporting and complaints', body: <P>Report content or members using the Report buttons, or use the <L to="/contact">contact & complaints form</L>. You can appeal a moderation decision. See the <L to="/grievance-policy">Grievance & Complaint Policy</L>.</P> },
      { id: 'links', title: 'Third-party links', body: <P>Links to other websites are for convenience. We do not control and are not responsible for their content or practices.</P> },
      { id: 'availability', title: 'Availability', body: <P>We try to keep Homeo India available but do not promise it will always be uninterrupted or error-free. We may change or discontinue features, and will try to give notice of significant changes.</P> },
      { id: 'disclaimers', title: 'Disclaimers', body: <P>Content on Homeo India is posted by members and is for educational and professional discussion only. It is not medical advice, and we do not claim that content is evidence-based, clinically validated or approved. Apart from the express commitments in these Terms and the Privacy Policy, the service is provided "as is".</P> },
      { id: 'liability', title: 'Limitation of liability', body: <P>To the extent permitted by law, the operator is not liable for indirect or consequential losses, or for losses caused by members' content or conduct. Nothing in these Terms excludes or limits liability that cannot be excluded or limited under Indian law, including liability under consumer protection law.</P> },
      { id: 'indemnity', title: 'Indemnity', body: <P>To the extent permitted by law, you agree to compensate the operator for reasonable losses caused by your breach of these Terms or by content you post in breach of them.</P> },
      { id: 'changes', title: 'Changes to these Terms', body: <P>We may update these Terms. We will change the version number and date above, and for material changes we will ask signed-in members to review and accept the new version before continuing.</P> },
      { id: 'law', title: 'Governing law and jurisdiction', body: <P>These Terms are governed by the laws of India. Subject to any rights you have under consumer protection law to bring a complaint where you live, courts at {op(OPERATOR.jurisdictionCity)} have jurisdiction.</P> },
      { id: 'contact', title: 'Contact', body: <UL items={[<>Operator: {op(OPERATOR.legalName)}, {op(OPERATOR.address)}</>, <>Support: {op(OPERATOR.supportEmail)}</>, <>Grievance Officer: {op(OPERATOR.grievanceOfficerName)} — {op(OPERATOR.grievanceOfficerEmail)}</>, <><L to="/contact">Contact & complaints form</L></>]} /> },
    ]}
  />
);
