/**
 * Hazaribagh, Jharkhand — real-world inspired locations and local reviews.
 */

const HOURS = {
  hospital: { open: '08:00', close: '20:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] },
  clinic: { open: '09:00', close: '19:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] },
  bank: { open: '10:00', close: '16:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
  government: { open: '10:00', close: '17:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
};

const hazaribaghLocations = [
  {
    key: 'sadar-hospital',
    name: 'District Sadar Hospital, Hazaribagh',
    type: 'hospital',
    description:
      'Government district hospital on Sadar Hospital Road near the bus stand. OPD, emergency, pathology, and pharmacy counters serve Hazaribagh town and nearby blocks including Ichak, Katkamsandi, and Barkagaon.',
    address: 'Sadar Hospital Road, Near Old Bus Stand',
    city: 'Hazaribagh',
    state: 'Jharkhand',
    zip_code: '825301',
    phone: '+91 6546-267456',
    email: 'sadarhospital.hazaribagh@jharkhand.gov.in',
    operating_hours: HOURS.hospital,
    reviews: [
      {
        author: 'Priya Devi',
        role: 'Patient from Matwari',
        rating: 4,
        text: 'Booked OPD token from home before coming from Matwari side. Counter was ready when I reached — saved nearly an hour near the bus stand rush.',
        date: '2026-02-18',
      },
      {
        author: 'Sanjay Kumar',
        role: 'Attendant, Ichak block',
        rating: 5,
        text: 'Emergency queue update on phone was accurate. Staff called token E014 when we were still at Gorakh Nath Chowk.',
        date: '2026-01-29',
      },
      {
        author: 'Anita Kumari',
        role: 'Lab test patient',
        rating: 4,
        text: 'Pathology token system is better than standing in the old paper line. Only wish the SMS came 5 minutes earlier.',
        date: '2026-03-05',
      },
    ],
    queues: [
      { name: 'General OPD', description: 'Outpatient consultations', prefix: 'G', avg_service_time: 12, status: 'active' },
      { name: 'Emergency', description: 'Casualty and urgent cases', prefix: 'E', avg_service_time: 18, status: 'active' },
      { name: 'Pathology & Lab', description: 'Blood tests and reports', prefix: 'L', avg_service_time: 8, status: 'active' },
    ],
    organizationEmail: 'kanthisha2@gmail.com',
  },
  {
    key: 'canning-hospital',
    name: 'Canning Hospital, Hazaribagh',
    type: 'hospital',
    description:
      'Multi-specialty hospital at Matwari Chowk with general medicine, surgery, gynaecology, and diagnostic services. A well-known private hospital for Hazaribagh residents.',
    address: 'Matwari Chowk, Main Road',
    city: 'Hazaribagh',
    state: 'Jharkhand',
    zip_code: '825301',
    phone: '+91 6546-270007',
    email: 'info@canninghospitalhzb.in',
    operating_hours: { open: '00:00', close: '23:59', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
    reviews: [
      {
        author: 'Md. Imran Ansari',
        role: 'Local shopkeeper, Matwari',
        rating: 5,
        text: 'My father\'s cardiology follow-up token was smooth. No crowd at the Matwari Chowk gate — we waited near our shop until the app pinged.',
        date: '2026-02-22',
      },
      {
        author: 'Sunita Sinha',
        role: 'Patient from Barhi',
        rating: 4,
        text: 'Came from Barhi by bus. Digital queue at reception is organised; only parking near Chowk is still tight on Saturdays.',
        date: '2026-01-15',
      },
    ],
    queues: [
      { name: 'General Consultation', description: 'Walk-in physician OPD', prefix: 'C', avg_service_time: 15, status: 'active' },
      { name: 'Diagnostics', description: 'X-ray, USG, and lab collection', prefix: 'D', avg_service_time: 10, status: 'active' },
    ],
  },
  {
    key: 'esi-hospital',
    name: 'ESI Hospital, Hazaribagh',
    type: 'hospital',
    description:
      'Employees\' State Insurance hospital serving registered workers and dependents from Hazaribagh industrial and mining belt areas.',
    address: 'GT Road (NH-33), Near ESI Dispensary Complex',
    city: 'Hazaribagh',
    state: 'Jharkhand',
    zip_code: '825301',
    phone: '+91 6546-272341',
    email: 'esi.hazaribagh@esic.gov.in',
    operating_hours: HOURS.hospital,
    reviews: [
      {
        author: 'Ram Bilas Yadav',
        role: 'ESI card holder, Barkagaon',
        rating: 4,
        text: 'Token for medicine counter was fair. Earlier we used to miss turn when name was called at the GT Road gate.',
        date: '2026-02-08',
      },
      {
        author: 'Geeta Devi',
        role: 'Dependant patient',
        rating: 5,
        text: 'OPD token on phone helped — travelled from Katkamsandi and reached exactly when our number was near.',
        date: '2026-03-01',
      },
    ],
    queues: [
      { name: 'ESI OPD', description: 'Insured patient consultations', prefix: 'O', avg_service_time: 14, status: 'active' },
      { name: 'Pharmacy Counter', description: 'Prescription medicines', prefix: 'P', avg_service_time: 5, status: 'active' },
    ],
  },
  {
    key: 'matwari-clinic',
    name: 'Matwari Family Clinic',
    type: 'clinic',
    description:
      'Neighbourhood clinic near Matwari Chowk offering general physician visits, fever clinic, and basic pathology sample collection.',
    address: '1st Floor, Opp. Canning Hospital Lane, Matwari',
    city: 'Hazaribagh',
    state: 'Jharkhand',
    zip_code: '825301',
    phone: '+91 98765-43210',
    email: 'matwariclinic@gmail.com',
    operating_hours: HOURS.clinic,
    reviews: [
      {
        author: 'Ajay Mahto',
        role: 'Daily commuter to Ranchi',
        rating: 5,
        text: 'Quick token for fever check before catching the Ranchi bus from Chowk. Doctor saw me within 20 minutes.',
        date: '2026-02-14',
      },
      {
        author: 'Neha Kumari',
        role: 'College student, St. Columba\'s area',
        rating: 4,
        text: 'Small clinic but queue app is honest about wait. Better than guessing from the waiting room crowd.',
        date: '2026-01-20',
      },
    ],
    queues: [
      { name: 'General Physician', description: 'Walk-in consultations', prefix: 'M', avg_service_time: 10, status: 'active' },
    ],
  },
  {
    key: 'sadar-clinic',
    name: 'Sadar Health Care Clinic',
    type: 'clinic',
    description:
      'Private clinic on Sadar Hospital Road providing GP visits, wound dressing, and vaccination slots for town residents.',
    address: 'Sadar Hospital Road, Near Petrol Pump',
    city: 'Hazaribagh',
    state: 'Jharkhand',
    zip_code: '825301',
    phone: '+91 94313-55678',
    email: 'sadarhealthcare.clinic@gmail.com',
    operating_hours: HOURS.clinic,
    reviews: [
      {
        author: 'Vikash Ram',
        role: 'Auto driver, bus stand',
        rating: 5,
        text: 'I book token between trips from the stand. Vaccination queue moved fast on Sunday camp day.',
        date: '2026-02-27',
      },
    ],
    queues: [
      { name: 'Consultation', description: 'Doctor appointments', prefix: 'S', avg_service_time: 12, status: 'active' },
      { name: 'Vaccination', description: 'Immunisation counter', prefix: 'V', avg_service_time: 6, status: 'active' },
    ],
  },
  {
    key: 'sbi-hazaribagh',
    name: 'State Bank of India — Hazaribagh Main Branch',
    type: 'bank',
    description:
      'Main SBI branch at Gorakh Nath Chowk serving savings, current accounts, pension, and NEFT/RTGS services for Hazaribagh district.',
    address: 'Gorakh Nath Chowk, NH-33',
    city: 'Hazaribagh',
    state: 'Jharkhand',
    zip_code: '825301',
    phone: '+91 6546-270127',
    email: 'sbihazaribagh.main@sbi.co.in',
    operating_hours: HOURS.bank,
    reviews: [
      {
        author: 'Shyam Sundar Singh',
        role: 'Pensioner, Sadar',
        rating: 4,
        text: 'Pension token saved a full morning queue at Chowk. Clerk was ready when number C008 displayed.',
        date: '2026-02-05',
      },
      {
        author: 'Ritu Prasad',
        role: 'Business owner, Matwari market',
        rating: 5,
        text: 'Current account work used to mean two visits. Now I track token from shop and reach branch once.',
        date: '2026-01-30',
      },
    ],
    queues: [
      { name: 'Account Services', description: 'Passbook, KYC, and account changes', prefix: 'A', avg_service_time: 18, status: 'active' },
      { name: 'Cash & Pension Counter', description: 'Withdrawals and pension payments', prefix: 'C', avg_service_time: 12, status: 'active' },
    ],
  },
  {
    key: 'boi-hazaribagh',
    name: 'Bank of India — Hazaribagh Branch',
    type: 'bank',
    description:
      'BOI branch near Matwari for personal banking, loan enquiry, and government scheme account services.',
    address: 'Matwari, Near Main Market',
    city: 'Hazaribagh',
    state: 'Jharkhand',
    zip_code: '825301',
    phone: '+91 6546-270412',
    email: 'boihazaribagh@bankofindia.co.in',
    operating_hours: HOURS.bank,
    reviews: [
      {
        author: 'Manoj Kumar',
        role: 'Farmer, Daru block',
        rating: 4,
        text: 'Loan enquiry token was clear. Waited at tea stall near market until app showed 3 people ahead.',
        date: '2026-02-11',
      },
    ],
    queues: [
      { name: 'Deposit & Withdrawal', description: 'Cash counter services', prefix: 'D', avg_service_time: 10, status: 'active' },
      { name: 'Loan Desk', description: 'Agriculture and personal loan queries', prefix: 'L', avg_service_time: 22, status: 'active' },
    ],
  },
  {
    key: 'hdfc-matwari',
    name: 'HDFC Bank — Matwari Chowk',
    type: 'bank',
    description:
      'HDFC Bank branch at Matwari Chowk for savings accounts, lockers, and digital banking support.',
    address: 'Matwari Chowk, Ground Floor, NH-33 Side',
    city: 'Hazaribagh',
    state: 'Jharkhand',
    zip_code: '825301',
    phone: '+91 6546-271890',
    email: 'hdfcmatwari.hazaribagh@hdfcbank.com',
    operating_hours: HOURS.bank,
    reviews: [
      {
        author: 'Kavita Jaiswal',
        role: 'Teacher, Hazaribagh town',
        rating: 5,
        text: 'Locker access token is well managed. No more standing in Matwari sun for an hour.',
        date: '2026-03-08',
      },
    ],
    queues: [
      { name: 'Customer Service', description: 'Account opening and locker', prefix: 'H', avg_service_time: 20, status: 'active' },
    ],
  },
  {
    key: 'collectorate',
    name: 'District Collectorate, Hazaribagh',
    type: 'government',
    description:
      'Deputy Commissioner office campus for revenue certificates, domicile, income certificates, and grievance hearings.',
    address: 'Collectorate Campus, Sadar',
    city: 'Hazaribagh',
    state: 'Jharkhand',
    zip_code: '825301',
    phone: '+91 6546-270101',
    email: 'dc.hazaribagh@jharkhand.gov.in',
    operating_hours: HOURS.government,
    reviews: [
      {
        author: 'Prakash Mahto',
        role: 'Applicant for income certificate',
        rating: 4,
        text: 'Revenue counter token was transparent. Reached collectorate from Ichak road when 2 tokens were left.',
        date: '2026-02-19',
      },
      {
        author: 'Sushila Devi',
        role: 'Domicile applicant',
        rating: 5,
        text: 'First time using digital queue at DC office. Clerk called exact token — no jumping the line.',
        date: '2026-01-22',
      },
    ],
    queues: [
      { name: 'Revenue & Certificate Counter', description: 'Income, domicile, and caste certificates', prefix: 'R', avg_service_time: 15, status: 'active' },
      { name: 'Grievance Cell', description: 'Public hearing and complaints', prefix: 'G', avg_service_time: 20, status: 'active' },
    ],
  },
  {
    key: 'civil-court',
    name: 'Civil Court, Hazaribagh',
    type: 'government',
    description:
      'District civil court compound for case filing, cause-list enquiry, and certified copy applications under Hazaribagh judiciary.',
    address: 'Court Compound, Near Sadar Thana Road',
    city: 'Hazaribagh',
    state: 'Jharkhand',
    zip_code: '825301',
    phone: '+91 6546-270234',
    email: 'civilcourt.hazaribagh@yopmail.com',
    operating_hours: HOURS.government,
    reviews: [
      {
        author: 'Adv. Rakesh Kumar',
        role: 'Advocate, Hazaribagh Bar',
        rating: 5,
        text: 'Filing desk token helps clients know when to enter compound. Less crowding at the main gate.',
        date: '2026-02-16',
      },
      {
        author: 'Munni Devi',
        role: 'Litigant from Keredari',
        rating: 4,
        text: 'Case status counter called our token on time. Helpful for people travelling from villages.',
        date: '2026-03-02',
      },
    ],
    queues: [
      { name: 'General Enquiry Counter', description: 'Cause list and court room directions', prefix: 'E', avg_service_time: 8, status: 'active' },
      { name: 'Case Status & Filing Desk', description: 'New filing and certified copies', prefix: 'F', avg_service_time: 18, status: 'active' },
    ],
    organizationEmail: 'civilcourt.hazaribagh@yopmail.com',
  },
  {
    key: 'rto-hazaribagh',
    name: 'DTO / RTO Office, Hazaribagh',
    type: 'government',
    description:
      'District Transport Office on GT Road for driving licence, learner\'s licence, and vehicle registration services.',
    address: 'DTO Office, GT Road (NH-33), Near Polytechnic',
    city: 'Hazaribagh',
    state: 'Jharkhand',
    zip_code: '825301',
    phone: '+91 6546-271045',
    email: 'dto.hazaribagh@transport.jharkhand.gov.in',
    operating_hours: HOURS.government,
    reviews: [
      {
        author: 'Abhishek Kumar',
        role: 'Learner\'s licence applicant',
        rating: 4,
        text: 'DL token saved half a day at DTO. Reached from Ranchi road when 4 were ahead on screen.',
        date: '2026-02-09',
      },
      {
        author: 'Pankaj Yadav',
        role: 'Two-wheeler registration',
        rating: 5,
        text: 'Registration counter queue was predictable. Staff respected token order — big change for Hazaribagh RTO.',
        date: '2026-01-18',
      },
    ],
    queues: [
      { name: 'Driving Licence Counter', description: 'LL and DL applications', prefix: 'D', avg_service_time: 25, status: 'active' },
      { name: 'Vehicle Registration', description: 'RC and transfer of ownership', prefix: 'V', avg_service_time: 30, status: 'active' },
    ],
  },
  {
    key: 'sub-registrar',
    name: 'Sub-Registrar Office, Hazaribagh',
    type: 'government',
    description:
      'Registration office for property sale deeds, lease agreements, and stamp duty verification in Hazaribagh district.',
    address: 'Sub-Registrar Office, Sadar, Near Kutchery Road',
    city: 'Hazaribagh',
    state: 'Jharkhand',
    zip_code: '825301',
    phone: '+91 6546-270567',
    email: 'subregistrar.hazaribagh@jharkhand.gov.in',
    operating_hours: HOURS.government,
    reviews: [
      {
        author: 'Harish Chandra',
        role: 'Property buyer, Hazaribagh town',
        rating: 4,
        text: 'Deed registration token was accurate within 15 minutes. Still crowded outside but inside was orderly.',
        date: '2026-02-25',
      },
    ],
    queues: [
      { name: 'Document Registration', description: 'Sale deed and agreement registration', prefix: 'R', avg_service_time: 35, status: 'active' },
    ],
  },
];

module.exports = { hazaribaghLocations, HOURS };
