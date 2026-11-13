import React from 'react';
import { Link } from 'react-router-dom';
import { LegalDocument, P, UL, Note } from '../../legal/LegalDocument';

const L: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => <Link to={to} className="text-teal-700 underline">{children}</Link>;

export const CommunityGuidelinesPage: React.FC = () => (
  <LegalDocument
    doc="community_guidelines"
    intro={<>Homeo India works because members can trust each other. These guidelines apply to everything you post, send or share here.</>}
    sections={[
      { id: 'principles', title: 'Our principles', body: <UL items={['Be respectful and professional, even when you disagree.', 'Be honest about who you are and what you know.', 'Protect patients\' privacy.', 'Share knowledge responsibly and cite your sources.']} /> },
      { id: 'not-allowed', title: 'Not allowed', body: <UL items={[
        'Harassment, threats, bullying, hate speech or abusive language.',
        'Impersonating anyone, or claiming qualifications, registrations or titles you do not hold.',
        'Misleading professional titles (for example, calling yourself a specialist without a recognised qualification for it).',
        'Fabricated, plagiarised or misrepresented research.',
        'Copyright infringement — posting others\' work without permission.',
        'Spam, chain messages, unsolicited promotion or advertising.',
        'Fraud, scams or attempts to collect other members\' data.',
        'Patient-identifiable information of any kind.',
        'Misleading clinical claims, such as promising cures.',
        'Defamatory, obscene or illegal content.',
        'Sharing confidential information you were not authorised to share.',
      ]} /> },
      { id: 'clinical', title: 'Clinical discussion rules', body: (<>
        <Note>Clinical discussions on Homeo India are educational. Homeo India is not a patient consultation service and provides no emergency medical help. In an emergency, contact emergency services (112 in India).</Note>
        <UL items={[
          'De-identify every case: no names, addresses, phone numbers, ID or hospital numbers, exact dates, rare details or photographs that could identify a patient.',
          'Do not upload identifiable photos or records unless you have a valid legal basis and the patient\'s informed consent — and even then only if it is necessary for the discussion.',
          'Present cases and opinions for learning, not as instructions for a specific patient.',
          'Students and interns must not represent themselves as licensed practitioners or give independent clinical advice.',
          'Mentorship on Homeo India is educational guidance; it does not authorise anyone to practise independently.',
          'Do not ask for or give individual treatment advice for members of the public.',
        ]} />
      </>) },
      { id: 'research', title: 'Research and evidence', body: <P>Cite authors, journal and a DOI or link. Say when something is your opinion or a preliminary finding. Share full texts only when allowed (see the <L to="/copyright">Copyright Policy</L>).</P> },
      { id: 'reporting', title: 'Reporting', body: <P>Use the Report button on any post, comment or profile, or the <L to="/contact">contact form</L> for copyright, privacy or other complaints. Reports are confidential; the person you report is not told who reported them.</P> },
      { id: 'moderation', title: 'How moderation works', body: (<>
        <P>Our moderators review reports and may:</P>
        <UL items={['take no action, if the content follows these guidelines;', 'hide or remove a post or comment;', 'warn the member;', 'suspend the account temporarily;', 'close the account permanently for serious or repeated breaches, such as impersonation or posting patient-identifiable information.']} />
        <P>Moderation actions are recorded in an audit log. Content that breaks the law may be reported to the authorities where required.</P>
      </>) },
      { id: 'appeals', title: 'Appeals', body: <P>If you think a moderation decision was wrong, appeal through the <L to="/contact">contact form</L> (choose "Appeal a decision"). Someone who was not involved in the original decision will review it where possible, and we will tell you the outcome. See the <L to="/grievance-policy">Grievance & Complaint Policy</L>.</P> },
    ]}
  />
);
