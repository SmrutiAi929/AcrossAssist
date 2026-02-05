/**
 * HMS Department Directory - Sample Data
 */

export interface HmsDepartment {
  department: string;
  doctors: string[];
}

/*
export const hmsDepartmentDirectory: HmsDepartment[] = [
  {
    department: 'Cardiology',
    doctors: [
      'Dr Ghassan Nouh — Consultant Interventional Cardiologist',
      'Dr Mohamed Houcem Amiour — Specialist Interventional Cardiologist',
    ],
  },
  {
    department: 'Neurology & Neurosurgery',
    doctors: [
      'Dr Nabil Akkawi — Consultant Neurologist',
      'Dr Haytham Eloqayli — Consultant Neurosurgeon',
      'Dr Dina Albo Reesha — Consultant Neurologist',
      'Dr Emad Hamza — Specialist Neurosurgeon',
      'Dr Mohammad Alolama — Consultant Neurosurgeon',
    ],
  },
  {
    department: 'Orthopedics & Trauma Surgery',
    doctors: [
      'Dr Ahmed Samy — Consultant Orthopedic Surgeon and Sports Medicine',
      'Dr Hani Eltair — Consultant Trauma & Orthopedic Surgeon',
      'Dr Jinwoo An — Consultant Orthopedic Surgeon',
      'Dr Mohamed Shawkat — Specialist Orthopedic Surgeon',
      'Dr Mohamed Kandil — Specialist Orthopedic Surgeon',
      'Dr Bilal El Yafawi — Consultant Orthopedic Surgeon',
      'Dr Waleed Mohammed — Specialist Orthopedic Surgeon',
    ],
  },
  {
    department: 'Internal Medicine & General Medicine',
    doctors: [
      'Dr Dirar Abdallah — Consultant Internal Medicine',
      'Dr Wafa Douleh — Consultant Internal Medicine',
      'Dr Mona Salaheldin — Specialist Internal Medicine',
      'Dr Ali Monjed Al Nabelsi — Specialist Internal Medicine',
    ],
  },
  {
    department: 'Oncology & Hematology',
    doctors: [
      'Dr Mohamad Azzam Ziade — Consultant Oncologist & Hematologist',
    ],
  },
  {
    department: 'Pulmonology & Respiratory Medicine',
    doctors: [
      'Dr Hala Samaha — Consultant Pulmonologist',
      'Dr Rahaf Al King — Specialist Pulmonologist',
    ],
  },
  {
    department: 'Gastroenterology & Hepatology',
    doctors: [
      'Dr Anand Nathwani — Specialist Gastroenterology & Hepatology',
      'Dr Eman AlNaoufi — Specialist Gastroenterologist',
      'Dr Ahmed Saber Youness — Specialist Gastroenterologist',
    ],
  },
  {
    department: 'Psychiatry',
    doctors: [
      'Dr Eman Aboseeda — Consultant Psychiatrist',
    ],
  },
  {
    department: 'General, Colorectal & Laparoscopic Surgery',
    doctors: [
      'Dr Mohamed Tawfek Jabri — Consultant General/Colorectal Surgeon',
      'Dr Adam Turk — Consultant General/Colorectal Surgeon',
      'Dr Mohd Hakam Abu Naj — Consultant General/Colorectal Surgeon',
      'Dr Mohammad AlDaas — Specialist General & Laparoscopic Surgeon',
      'Dr Alya Mazrouei — Consultant General Surgeon',
      'Dr Humaa Darr — Consultant Breast & General Surgeon',
    ],
  },
  {
    department: 'Obstetrics & Gynecology',
    doctors: [
      'Dr Wael Hosni — Consultant Obstetrician & Gynecologist',
      'Dr Omowunmi Braithwaite — Consultant Obstetrician & Gynecologist',
      'Dr Nagham AlObaidi — Specialist Obstetrician & Gynecologist',
      'Dr Rawneq Al Hamdani — Specialist Obstetrician & Gynecologist',
      'Dr Alaa Mohialdeen — Specialist Obstetrician & Gynecologist',
      'Dr Esraa Al Mashhadi — Specialist Obstetrician & Gynecologist',
      'Dr Nahla Rashad — Specialist Obstetrician & Gynecologist',
    ],
  },
  {
    department: 'Pediatrics & Neonatology',
    doctors: [
      'Dr Khawlla Drweesh — Consultant Pediatrician',
      'Dr Mennatallah Farouk — Consultant Pediatrician',
      'Dr Chaalan AlKayakhi — Consultant Pediatrician',
      'Dr Mohamed Sadik — Specialist Neonatologist',
      'Dr Ahmed Elmelhat — Specialist Pediatrician & Neonatologist',
      'Dr Mohammad ElRabah — Specialist Pediatrician',
    ],
  },
  {
    department: 'Anesthesia & Critical Care',
    doctors: [
      'Dr Manizha Jacobi — Consultant Anesthesia & Critical Care',
      'Dr Tarek Nassar — Consultant Anesthesia & Pain Management',
      'Dr Amr Rabie — Consultant Critical Care Medicine',
    ],
  },
  {
    department: 'Urology',
    doctors: [
      'Dr Dawood Kashmoula — Consultant Urologist / Chief Medical Officer',
    ],
  },
  {
    department: 'Plastic Surgery',
    doctors: [
      'Dr Ahmed Ghanem — Consultant Plastic Surgeon',
    ],
  },
  {
    department: 'Dermatology (Skin & Aesthetic Care)',
    doctors: [
      'Dr Lina AlKurdi — Consultant Dermatologist',
      'Dr Seham AlMustafa — Specialist Dermatologist',
      'Dr Nawar Halima — Specialist Dermatologist',
    ],
  },
  {
    department: 'Dentistry & Implantology',
    doctors: [
      'Dr Sara Hisham Kirat — General & Cosmetic Dentist',
      'Dr Jency Johnson — Specialist Pediatric Dentist',
      'Dr Nidhal Sultan — General Dentist & Implantologist',
      'Dr Mahmoud Fawzi — General & Cosmetic Dentist / Implantologist',
    ],
  },
  {
    department: 'Ophthalmology',
    doctors: [
      'Dr Basel AlFaaouri — Consultant Ophthalmologist',
      'Dr Hani Massoud — Consultant Ophthalmologist',
      'Dr Lama Sharbek — Specialist Ophthalmologist',
      'Dr Khalid Lootah — Ophthalmologist',
      'Dr Moza Al Matrooshi — Consultant Ophthalmologist',
    ],
  },
  {
    department: 'ENT (Otolaryngology)',
    doctors: [
      'Dr Mohamed Fawzy — Consultant ENT',
      'Dr Sam Aboud — Specialist Otolaryngologist',
      'Dr Hanadi Shahla — Specialist Otolaryngologist',
    ],
  },
  {
    department: 'Vascular & Nephrology',
    doctors: [
      'Dr Mohammed Abuazab — Consultant Vascular Surgeon',
      'Dr Shihab Elmaki — Consultant Nephrologist',
      'Dr Kareem Al Dulaimi — Consultant Nephrologist',
      'Dr Nihan Tekkarismaz — Specialist Nephrologist',
    ],
  },
  {
    department: 'Endocrinology & Diabetes',
    doctors: [
      'Dr Amina Bouhelassa — Specialist Endocrinology & Diabetes',
    ],
  },
  {
    department: 'Rheumatology',
    doctors: [
      'Dr Maison Kudsi — Specialist Rheumatologist',
    ],
  },
  {
    department: 'Radiology & Imaging',
    doctors: [
      'Dr Tamer Mustafa — Consultant Interventional Radiologist',
      'Dr Mohammed Gomaa — Consultant Diagnostic & Interventional Radiologist',
    ],
  },
  {
    department: 'Nutrition & Dietetics',
    doctors: [
      'Ms Rouba Kahil — Dietitian',
    ],
  },
  {
    department: 'Genetics',
    doctors: [
      'Dr Fatma Bastaki — Consultant Medical Geneticist',
    ],
  },
];
*/


export interface TowingCaseData {
  vendor_location: string;
  vehicle_name: string;
  issue_type: string;
  KMS: string;
  pickup_location: string;
  drop_location: string;
  case_number: string;
}

export const sampleTowingCase: TowingCaseData = {
  vendor_location: "Sector 62, Noida",
  vehicle_name: "Audi A4",
  issue_type: "Engine Failure",
  KMS: "15",
  pickup_location: "Maple Tower, Sector 62, Noida",
  drop_location: "Audi Service Center, Okhla Phase 3",
  case_number: "AA-9988-22",
};
