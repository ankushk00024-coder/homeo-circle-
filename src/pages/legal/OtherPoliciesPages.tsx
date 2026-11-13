import React from 'react';
import { Link } from 'react-router-dom';
import { LegalDocument, P, UL, Note, Table } from '../../legal/LegalDocument';
import { OPERATOR, op } from '../../legal/config';

const L: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => <Link to={to} className="text-teal-700 underline">{children}</Link>;

export const CopyrightPolicyPage: React.FC = () => (
  <LegalDocument doc="copyright" intro={<>The Research Library helps members find and discuss research while respecting authors' and publishers' rights under the Copyright Act, 1957.</>}
    sections={[
      { id: 'allowed', title: 'What you may share', body: <UL items={['Citations and links to publications (title, authors, journal or publisher, date, DOI or URL).', 'Your own summary of a study, in your own words.', 'Full texts that are openly licensed (open access) — state the licence.', 'Full texts you have the copyright holder\'s permission to share.', 'Your own original work.']} /> },
      { id: 'not-allowed', title: 'What you may not share', body: <UL items={['Full-text articles, chapters or books from subscription journals or publishers without permission.', 'Copied abstracts or figures in a way that goes beyond fair dealing.', 'Invented studies, authors, journals or references.']} /> },
      { id: 'licence', title: 'Licence information', body: <P>Every research post records its basis: summary and link only, open access, shared with permission, or original work. A full-text PDF can only be attached for the last three.</P> },
      { id: 'takedown', title: 'Reporting infringement (takedown)', body: (<>
        <P>If you believe content on Homeo India infringes your copyright, send a notice through the <L to="/contact">contact form</L> (choose "Copyright") with: your name and contact details; the work you own; the link to the content; why you believe it infringes; and a statement that the information is accurate.</P>
        <P>We will review the notice, remove or disable access to infringing material where appropriate, inform the member who posted it, and allow them to respond. Repeat infringers may lose their accounts.</P>
      </>) },
    ]} />
);

export const ClinicalDisclaimerPage: React.FC = () => (
  <LegalDocument doc="clinical_disclaimer"
    sections={[
      { id: 'educational', title: 'Educational purpose only', body: <P>Clinical discussions, cases and research on Homeo India are shared between members for education and professional learning. They are not medical advice for any individual.</P> },
      { id: 'no-consultation', title: 'Not a consultation service', body: <P>Homeo India does not provide consultations, diagnosis or treatment, and is not a substitute for a consultation with a qualified, registered practitioner who examines the patient.</P> },
      { id: 'emergency', title: 'No emergency help', body: <Note>Homeo India provides no emergency medical assistance. In an emergency, call 112 or go to the nearest hospital.</Note> },
      { id: 'responsibility', title: 'Professional responsibility', body: <P>Practitioners remain responsible for their own clinical decisions and must follow the professional conduct rules that apply to them. Students and interns must not act on discussions independently; they practise only under supervision. Mentorship on Homeo India does not authorise independent practice.</P> },
      { id: 'no-endorsement', title: 'No endorsement', body: <P>Views in posts are those of their authors. Homeo India does not verify or endorse clinical claims and does not claim that content is evidence-based or clinically validated.</P> },
      { id: 'privacy', title: 'Patient privacy', body: <P>Never post information that could identify a patient. See the <L to="/community-rules">Community Guidelines</L>.</P> },
    ]} />
);

export const GrievancePolicyPage: React.FC = () => (
  <LegalDocument doc="grievance"
    intro={<>How to raise a complaint, a privacy request, a copyright notice or an appeal — and what happens next.</>}
    sections={[
      { id: 'how', title: 'How to complain', body: <UL items={[<>Use the <L to="/contact">contact & complaints form</L>. You can use it without an account.</>, 'Use the Report button on posts, comments and profiles for content problems.', <>Signed-in members can make privacy requests from <L to="/profile#privacy">Edit Profile → Privacy & your data</L>.</>]} /> },
      { id: 'officer', title: 'Grievance Officer', body: <UL items={[<>Name: {op(OPERATOR.grievanceOfficerName)}</>, <>Email: {op(OPERATOR.grievanceOfficerEmail)}</>, <>Address: {op(OPERATOR.grievanceOfficerAddress)}</>]} /> },
      { id: 'process', title: 'What happens', body: (<>
        <Table head={['Step', 'What we do']} rows={[
          ['Received', 'Your complaint is recorded with a reference.'],
          ['Acknowledged', 'We acknowledge it. Where the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021 apply, this is within 24 hours.'],
          ['Investigation', 'We review the content or request, and may contact you or the other member.'],
          ['Outcome', 'We tell you what we decided and why. Where the IT Rules apply, complaints are resolved within 15 days; some requests (such as removal of certain unlawful content) have shorter legal deadlines.'],
        ]} />
        <P>Signed-in members see updates in their notifications.</P>
      </>) },
      { id: 'escalation', title: 'If you are not satisfied', body: <P>Ask for a review through the contact form (choose "Appeal a decision"). Depending on the issue, you may also be able to appeal to the Grievance Appellate Committee under the IT Rules, or complain to the Data Protection Board of India about personal-data issues once that route is available to you.</P> },
      { id: 'records', title: 'Records', body: <P>We keep complaints and their outcomes for up to 3 years after they are closed, to handle follow-ups and show accountability.</P> },
    ]} />
);

export const CookiePolicyPage: React.FC = () => (
  <LegalDocument doc="cookies"
    sections={[
      { id: 'summary', title: 'Summary', body: <P>Homeo India does not use advertising, tracking or analytics cookies. It uses only the browser storage needed to keep you signed in.</P> },
      { id: 'what', title: 'What is stored', body: <Table head={['Name / type', 'Purpose', 'How long']} rows={[
        ['Supabase sign-in session (local storage, "sb-…-auth-token")', 'Keeps you signed in and refreshes your session securely', 'Until you sign out'],
        ['Profile copy (local storage, "homeocircle_current_user")', 'Shows your name and photo quickly while the page loads', 'Until you sign out'],
        ['Small preference flags (session storage)', 'Remembers that you dismissed a prompt', 'Until you close the tab'],
      ]} /> },
      { id: 'third-party', title: 'Third parties', body: <P>Pages load fonts from Google Fonts, which receives your IP address. If you sign in with Google, Google's own cookies apply on Google's pages.</P> },
      { id: 'control', title: 'Your choices', body: <P>Signing out clears the session. You can also clear site data in your browser settings; you will then need to sign in again.</P> },
    ]} />
);
