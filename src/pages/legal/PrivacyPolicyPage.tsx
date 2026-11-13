import React from 'react';
import { Link } from 'react-router-dom';
import { LegalDocument, P, UL, Note, Table } from '../../legal/LegalDocument';
import { OPERATOR, op } from '../../legal/config';

export const PrivacyPolicyPage: React.FC = () => (
  <LegalDocument
    doc="privacy"
    intro={<>This policy explains what personal data Homeo India collects, why, who helps us process it, how long we keep it and how you can exercise your rights. It describes how the website actually works today.</>}
    sections={[
      {
        id: 'introduction', title: 'Introduction and who we are',
        body: (<>
          <P>Homeo India is an independent online academic and professional community for homoeopathic practitioners, BHMS students, interns, qualified graduates and academic members in India. It is not a government authority, statutory medical council, licensing body or registration authority.</P>
          <P>Homeo India is operated by <strong>{op(OPERATOR.legalName)}</strong>, {op(OPERATOR.address)} ("we", "us"). For the purposes of the Digital Personal Data Protection Act, 2023 we are the Data Fiduciary for the personal data described here.</P>
          <P>This policy covers the website at www.homeoindia.org and the services offered through it. It does not cover websites we link to.</P>
        </>),
      },
      {
        id: 'collected', title: 'Information we collect',
        body: (<>
          <P>We collect only what each feature needs. Depending on how you use Homeo India:</P>
          <Table head={['Category', 'What', 'When']} rows={[
            ['Account', 'Name, email address, password (stored only as a secure hash by our authentication provider), profile photo', 'When you create an account or sign in with Google'],
            ['Contact & location', 'Mobile number, city, state', 'In your verification form'],
            ['Academic', 'College, year of study, internship hospital and period, qualification, year of passing', 'In student, intern and graduate forms'],
            ['Professional', 'Registration number, registering authority, years of practice, area of interest, clinic or institution, academic role', 'In practitioner and academic forms, and your profile'],
            ['Verification documents', 'Registration or degree certificate, student ID / bonafide certificate, internship letter, institution ID', 'When you apply for verification'],
            ['Profile (optional)', 'Bio, interests, website and LinkedIn links, mentorship availability, visibility settings', 'When you edit your profile'],
            ['Content', 'Discussions, comments, photos you post, research posts, likes, saved posts, reports you file', 'When you take part in the community'],
            ['Connections & events', 'Connection requests and notes, mentorship requests, event registrations', 'When you use those features'],
            ['Requests & complaints', 'Privacy requests, complaints and appeals, and our replies', 'When you contact us through the site'],
            ['Consent records', 'Which policy versions you accepted, your age confirmation and marketing choice, with the time', 'At sign-up and when policies change'],
            ['Technical', 'IP address, browser and device type, sign-in times and security events', 'Recorded automatically in our providers\' security logs'],
          ]} />
          <P><strong>Sensitive or high-risk information.</strong> Verification documents and registration details are handled as high-risk data (see section 5). Homeo India does not ask for patient information. Members must not post anything that could identify a patient; if such content is reported or found, we remove it.</P>
        </>),
      },
      {
        id: 'purposes', title: 'Why we use your information',
        body: (<>
          <UL items={[
            <><strong>Your account</strong> — to create and secure your account and keep you signed in.</>,
            <><strong>Verification</strong> — to check your eligibility for the membership category you chose and show an accurate badge.</>,
            <><strong>Community features</strong> — to show your posts, profile and connections to other members as you choose.</>,
            <><strong>Events and academic activities</strong> — to register you for events you sign up for.</>,
            <><strong>Safety and security</strong> — to prevent fraud, impersonation, spam and abuse, and to investigate incidents.</>,
            <><strong>Support, complaints and your rights</strong> — to answer you and act on requests.</>,
            <><strong>Legal obligations</strong> — where a law requires us to keep or disclose information.</>,
            <><strong>Improving the service</strong> — to fix problems. We do not use advertising trackers or sell personal data.</>,
            <><strong>Updates by email</strong> — only if you opted in. You can withdraw this at any time.</>,
          ]} />
          <P>We rely on your consent (given at sign-up and in the verification form) and on legitimate uses permitted by law, such as complying with legal obligations. Where you withdraw consent, we stop the processing that depends on it; this may mean we can no longer provide parts of the service.</P>
        </>),
      },
      {
        id: 'visibility', title: 'What other members see',
        body: (<>
          <UL items={[
            'Your name, photo, membership badge, city/state, qualification, institution and bio are visible to signed-in members, or more widely if you set your profile to public. You can make your profile private in Edit Profile.',
            'Your mobile number, email address, registration documents and admin notes are never shown to other members.',
            'Your registration number is used for verification and is not shown in the public directory.',
            'Your posts and comments are visible to signed-in members.',
          ]} />
        </>),
      },
      {
        id: 'sharing', title: 'Who we share information with',
        body: (<>
          <P>We use these service providers (Data Processors) to run Homeo India. They process data on our instructions:</P>
          <Table head={['Provider', 'What they do', 'Data involved']} rows={[
            ['Supabase', 'Database, sign-in (authentication), file storage, sign-in emails', 'All account, profile, content and document data; sign-in logs'],
            ['Vercel', 'Hosting the website', 'Website requests (IP address, browser) in hosting logs'],
            ['Google', 'Optional "Continue with Google" sign-in; website fonts', 'If you use Google sign-in: your Google name, email and photo. Font requests send your IP address to Google'],
          ]} />
          <P>Our providers may store data outside India (for example, our database is hosted in a Supabase region in Japan and the website is served by Vercel's global network). We transfer data only as permitted by Indian law.</P>
          <P>We do not sell personal data and we do not use advertising or analytics trackers. We may disclose information to government authorities or courts when Indian law requires it, and only to the extent required.</P>
        </>),
      },
      {
        id: 'security', title: 'How we protect your information',
        body: (<>
          <UL items={[
            'All traffic uses HTTPS (encryption in transit). Our providers encrypt stored data at rest.',
            'Verification documents are kept in a private storage area. Only you and our verification staff can open them, through short-lived links.',
            'Database rules (row-level security) decide what each account can read or change. Members can only change their own data and cannot change their own verification status.',
            'Admin access is split into roles, and only verification staff can open verification documents.',
            'Important admin actions (approvals, role changes, privacy requests) are written to an audit log.',
            'Passwords are handled by our authentication provider and stored only as secure hashes; we never see them.',
            'Limits on how often accounts can post or send requests reduce spam and abuse.',
          ]} />
          <P>No system is completely secure. If a breach affects you, we will follow section 9.</P>
        </>),
      },
      {
        id: 'retention', title: 'How long we keep information',
        body: (<>
          <Table head={['Information', 'How long']} rows={[
            ['Account and profile', 'While your account is open. Deleted or anonymised after you ask us to erase it (section 8).'],
            ['Inactive accounts', 'If an account is unused for 3 years, we may contact you and then delete or anonymise it.'],
            ['Verification documents', 'While your application is open and for up to 12 months after the decision, then deleted — or earlier if you ask, unless we must keep them to resolve a dispute.'],
            ['Verification decisions and audit logs', 'Kept as a record of who was verified, when and on what basis, for as long as reasonably needed for accountability and legal claims. Personal details in them are minimised.'],
            ['Posts and comments', 'Until you or a moderator deletes them. After account erasure, remaining posts show "Former member" instead of your name.'],
            ['Security logs', 'Kept by our providers for the period their plans and applicable law require.'],
            ['Consent records', 'For as long as needed to show what you agreed to, including after you withdraw.'],
            ['Complaints and privacy requests', 'For up to 3 years after closure.'],
          ]} />
          <Note>Some of these periods are carried out by our team rather than automatically; we review stored documents and inactive accounts regularly.</Note>
        </>),
      },
      {
        id: 'rights', title: 'Your rights',
        body: (<>
          <P>Under the Digital Personal Data Protection Act, 2023 (as its provisions come into force) and other applicable law, you can:</P>
          <UL items={[
            <><strong>Access</strong> a summary of your personal data and how we process it.</>,
            <><strong>Correct or update</strong> inaccurate or incomplete data. Most profile details can be edited directly in Edit Profile.</>,
            <><strong>Erase</strong> your personal data when it is no longer needed for the purpose it was collected, unless the law requires us to keep it.</>,
            <><strong>Withdraw consent</strong> for processing that is based on consent, such as marketing emails.</>,
            <><strong>Nominate</strong> another person to exercise your rights if you die or become incapable.</>,
            <><strong>Raise a grievance</strong> with us, and, if you are not satisfied, with the Data Protection Board of India once it is available to you.</>,
          ]} />
          <P>Make a request from <Link to="/profile#privacy" className="text-teal-700 underline">Edit Profile → Privacy & your data</Link>, or through the <Link to="/contact" className="text-teal-700 underline">contact form</Link>. We verify that the request comes from the account holder and reply within the time the law allows.</P>
        </>),
      },
      {
        id: 'deletion', title: 'Deleting your account',
        body: (<>
          <P>Ask for erasure from Edit Profile. We then:</P>
          <UL items={[
            'confirm the request came from your signed-in account and record it;',
            'identify your personal data across your profile, applications, documents and content;',
            'check whether any data must be kept by law or to resolve a dispute;',
            'erase or anonymise the rest — your profile, documents and photos are removed and your posts show "Former member";',
            'record that the request was completed and tell you.',
          ]} />
          <P>Erasure is not instant because a person checks each request. Records we must keep are retained only for as long as needed.</P>
        </>),
      },
      {
        id: 'breaches', title: 'Data breaches',
        body: (<>
          <P>If we become aware of a personal data breach we will: contain it; investigate what happened and which data and people are affected; assess the risk; document it; notify the Data Protection Board of India and affected people where the law requires; report cyber incidents to CERT-In where required; and take steps to prevent it happening again.</P>
        </>),
      },
      {
        id: 'children', title: 'Children',
        body: (<>
          <P>Homeo India is only for people aged 18 or over. Everyone confirms their age when creating an account and when applying for verification. We do not knowingly process children's data; if we learn that an account belongs to someone under 18, we will close it and delete its data.</P>
        </>),
      },
      {
        id: 'cookies', title: 'Cookies and browser storage',
        body: (<>
          <P>We do not use advertising or analytics cookies. The site stores your sign-in session and a copy of your basic profile in your browser's local storage so you stay signed in. See the <Link to="/cookies" className="text-teal-700 underline">Cookie & Storage Policy</Link>.</P>
        </>),
      },
      {
        id: 'contact', title: 'Contact and grievances',
        body: (<>
          <UL items={[
            <>Operator: {op(OPERATOR.legalName)}, {op(OPERATOR.address)}</>,
            <>Privacy contact: {op(OPERATOR.privacyEmail)}</>,
            <>Grievance Officer: {op(OPERATOR.grievanceOfficerName)} — {op(OPERATOR.grievanceOfficerEmail)}</>,
            <>Online: the <Link to="/contact" className="text-teal-700 underline">contact & complaints form</Link></>,
          ]} />
          <P>How complaints are handled and escalated is described in the <Link to="/grievance-policy" className="text-teal-700 underline">Grievance & Complaint Policy</Link>.</P>
          <P>When we change this policy materially, we will update the version and date above and ask signed-in members to review it.</P>
        </>),
      },
    ]}
  />
);
