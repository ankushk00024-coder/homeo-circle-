import React from 'react';
import { LegalDocument, P, UL, Note, Table } from '../../legal/LegalDocument';
import { MEMBERSHIP_CATEGORIES } from '../../lib/membership';

export const VerificationPolicyPage: React.FC = () => (
  <LegalDocument
    doc="verification"
    intro={<>Homeo India reviews the academic and professional information submitted by members. Registered-practitioner status is displayed only after checking applicable professional registration records.</>}
    sections={[
      { id: 'principles', title: 'Principles', body: (<>
        <UL items={[
          'Degree verification, institutional verification, internship verification and professional registration verification are different checks.',
          'A verified degree does not mean a person is registered to practise.',
          'Only members whose professional registration has been checked receive the "Verified Registered Practitioner" badge.',
          'Uploading a document does not by itself verify anyone. A person reviews each application.',
        ]} />
        <Note>Homeo India has no statutory authority to grant, renew or cancel professional registration. Registration is a matter for the competent State or Central register.</Note>
      </>) },
      { id: 'categories', title: 'Categories, what we check and the badge', body: (
        <Table head={['Category', 'What we ask for', 'Badge']} rows={MEMBERSHIP_CATEGORIES.map((c) => [<strong key="l">{c.label}</strong>, c.needs.join('; '), c.badge])} />
      ) },
      { id: 'registration', title: 'Checking professional registration', body: (<>
        <P>For Registered Practitioner applications, our verification staff check the registration number and authority you give against the records available from the relevant register. They record where and when they checked, and the registration's validity date if one is shown. If records cannot be checked, the member is shown as "Qualification Verified — Registration Pending" instead.</P>
        <P>We do not assume that a particular qualification, or an older diploma, automatically gives a right to current registration.</P>
      </>) },
      { id: 'statuses', title: 'Statuses', body: <UL items={[
        <><strong>Pending</strong> — submitted and waiting for review.</>,
        <><strong>Additional information required</strong> — we need a clearer document or more details.</>,
        <><strong>Approved</strong> — verified for the category applied for.</>,
        <><strong>Rejected</strong> — we could not verify the details. You may apply again with better evidence.</>,
        <><strong>Registration lapsed or expired</strong> — the registration on record is no longer current; the practitioner badge is removed until re-verified.</>,
      ]} /> },
      { id: 'reverification', title: 'Re-verification', body: <P>We may re-check registrations when their validity ends, when a member's details change, or when concerns are reported. Members should tell us if their registration status changes. Each decision is kept in the member's verification history and the admin audit log.</P> },
      { id: 'documents', title: 'Your documents', body: <P>Documents are stored privately and can be opened only by you and our verification staff. They are used only for verification and are deleted as described in the Privacy Policy.</P> },
      { id: 'disputes', title: 'Disagreeing with a decision', body: <P>Use the contact form and choose "Verification". Include any new evidence. A different reviewer will look at it where possible.</P> },
    ]}
  />
);
