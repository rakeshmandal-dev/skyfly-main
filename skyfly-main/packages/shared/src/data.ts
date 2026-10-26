/**
 * EduVault AI — Seed & Fixture Data
 * Shared between API, Database, and Frontend fallbacks.
 */

export const SEED_SUBJECTS = [
  { id: "sub-1", name: "Mathematics", grade: "11-12 / JEE", topics: ["Calculus", "Algebra", "Coordinate Geometry", "Vectors", "Trigonometry"] },
  { id: "sub-2", name: "Physics", grade: "11-12 / JEE / NEET", topics: ["Kinematics", "Laws of Motion", "Thermodynamics", "Optics", "Electromagnetism"] },
  { id: "sub-3", name: "Chemistry", grade: "11-12 / JEE / NEET", topics: ["Physical Chemistry", "Organic Reactions", "Inorganic Coordination", "Atomic Structure"] },
  { id: "sub-4", name: "Biology", grade: "11-12 / NEET", topics: ["Cell Biology", "Genetics", "Human Physiology", "Ecology", "Plant Biology"] },
  { id: "sub-5", name: "Computer Science", grade: "College / Engineering", topics: ["Data Structures & Algorithms", "Operating Systems", "Computer Networks", "DBMS"] },
  { id: "sub-6", name: "General Aptitude", grade: "All Competitive", topics: ["Quantitative Aptitude", "Logical Reasoning", "Verbal Ability", "Data Interpretation"] }
];

export const SEED_NOTES = [
  { id: "n1", title: "Kinematics — Complete Revision Notes", subject: "Physics", semester: "Sem 1", unit: "Unit 1", pages: 24, downloads: 1204, featured: true, popular: true },
  { id: "n2", title: "Chemical Bonding & Molecular Structure", subject: "Chemistry", semester: "Sem 1", unit: "Unit 2", pages: 32, downloads: 980, featured: true, popular: false },
  { id: "n3", title: "Differential Calculus & Applications", subject: "Mathematics", semester: "Sem 2", unit: "Unit 3", pages: 40, downloads: 1520, featured: false, popular: true },
  { id: "n4", title: "Cell Structure and Genetic Code", subject: "Biology", semester: "Sem 1", unit: "Unit 1", pages: 28, downloads: 760, featured: false, popular: false },
  { id: "n5", title: "DSA — Arrays, Two Pointers & Hashing", subject: "Computer Science", semester: "Sem 3", unit: "Unit 2", pages: 36, downloads: 2140, featured: true, popular: true },
  { id: "n6", title: "Organic Reactions & Named Mechanisms", subject: "Chemistry", semester: "Sem 2", unit: "Unit 4", pages: 44, downloads: 890, featured: false, popular: false },
  { id: "n7", title: "Thermodynamics Laws & Heat Engines", subject: "Physics", semester: "Sem 2", unit: "Unit 3", pages: 30, downloads: 1050, featured: false, popular: true },
  { id: "n8", title: "Linear Algebra & Matrix Operations", subject: "Mathematics", semester: "Sem 3", unit: "Unit 1", pages: 38, downloads: 670, featured: false, popular: false },
  { id: "n9", title: "Evolution & Ecosystem Dynamics", subject: "Biology", semester: "Sem 3", unit: "Unit 2", pages: 26, downloads: 540, featured: false, popular: false },
  { id: "n10", title: "Operating Systems — CPU Scheduling & Memory", subject: "Computer Science", semester: "Sem 4", unit: "Unit 1", pages: 50, downloads: 1830, featured: true, popular: true }
];

export const SEED_NGO_PARTNERS = [
  { id: "ngo-1", name: "Vidyalaya Shiksha Foundation", contactEmail: "contact@vidyalayashiksha.org", referralCode: "VIDYA100" },
  { id: "ngo-2", name: "Rural Digital Learning Initiative", contactEmail: "info@ruraldigital.org", referralCode: "RURAL2026" },
  { id: "ngo-3", name: "Pratham Shiksha Mission", contactEmail: "programs@prathamshiksha.org", referralCode: "PRATHAM50" }
];

import type {
  QuizSet,
  QuizQuestion,
  UdaanResource,
  UdaanCommunityItem,
  UdaanOpportunity,
  UdaanAssistantResponse,
} from "./types.js";
export type Question = QuizQuestion;

export const QUIZZES: QuizSet[] = [
  {
    id: "phy-kin-e",
    subject: "Physics", topic: "Kinematics", difficulty: "Easy",
    questions: [
      { q: "SI unit of acceleration?", options: ["m/s", "m/s²", "N", "J"], answer: 1 },
      { q: "A body at rest has velocity?", options: ["Zero", "1 m/s", "Infinite", "Undefined"], answer: 0 },
      { q: "Slope of v-t graph gives?", options: ["Displacement", "Speed", "Acceleration", "Jerk"], answer: 2 },
      { q: "Area under v-t curve gives?", options: ["Acceleration", "Displacement", "Force", "Momentum"], answer: 1 },
      { q: "Free fall acceleration ≈?", options: ["9.8 m/s²", "10 N", "6.67", "3×10⁸"], answer: 0 },
    ],
  },
  {
    id: "chem-mole-m",
    subject: "Chemistry", topic: "Mole Concept", difficulty: "Medium",
    questions: [
      { q: "1 mole contains how many particles?", options: ["6.022×10²³", "3.14", "1.6×10⁻¹⁹", "9.1×10⁻³¹"], answer: 0 },
      { q: "Molar mass of water?", options: ["16", "18", "20", "22"], answer: 1 },
      { q: "Moles in 22g of CO₂?", options: ["0.25", "0.5", "1", "2"], answer: 1 },
      { q: "STP volume of 1 mole gas?", options: ["11.2 L", "22.4 L", "24 L", "44.8 L"], answer: 1 },
      { q: "Empirical formula of glucose?", options: ["CH₂O", "C₆H₁₂O₆", "CHO", "C₂H₄O₂"], answer: 0 },
    ],
  },
  {
    id: "math-calc-h",
    subject: "Mathematics", topic: "Calculus", difficulty: "Hard",
    questions: [
      { q: "d/dx(sin x) = ?", options: ["cos x", "-cos x", "-sin x", "tan x"], answer: 0 },
      { q: "∫ 1/x dx = ?", options: ["x", "ln|x| + C", "1/x²", "eˣ"], answer: 1 },
      { q: "Limit of (sin x)/x as x→0?", options: ["0", "1", "∞", "Undefined"], answer: 1 },
      { q: "d/dx(eˣ) = ?", options: ["eˣ", "x·eˣ⁻¹", "1", "ln x"], answer: 0 },
      { q: "∫₀^π sin x dx = ?", options: ["0", "1", "2", "π"], answer: 2 },
    ],
  },
  {
    id: "bio-cell-e",
    subject: "Biology", topic: "Cell", difficulty: "Easy",
    questions: [
      { q: "Powerhouse of cell?", options: ["Nucleus", "Mitochondria", "Ribosome", "ER"], answer: 1 },
      { q: "Site of protein synthesis?", options: ["Ribosome", "Golgi", "Lysosome", "Vacuole"], answer: 0 },
      { q: "Cell wall present in?", options: ["Animals", "Plants", "Both", "Neither"], answer: 1 },
      { q: "DNA is found in?", options: ["Cytoplasm", "Nucleus", "Cell wall", "Membrane"], answer: 1 },
      { q: "Cell theory proposed by?", options: ["Darwin", "Schleiden & Schwann", "Mendel", "Watson"], answer: 1 },
    ],
  },
  {
    id: "cs-dsa-m",
    subject: "Coding", topic: "DSA Basics", difficulty: "Medium",
    questions: [
      { q: "Time complexity of binary search?", options: ["O(n)", "O(log n)", "O(n²)", "O(1)"], answer: 1 },
      { q: "Stack follows?", options: ["FIFO", "LIFO", "Random", "Priority"], answer: 1 },
      { q: "Queue follows?", options: ["FIFO", "LIFO", "Random", "Priority"], answer: 0 },
      { q: "Best case of quicksort?", options: ["O(n log n)", "O(n²)", "O(n)", "O(log n)"], answer: 0 },
      { q: "Hash map average lookup?", options: ["O(n)", "O(log n)", "O(1)", "O(n²)"], answer: 2 },
    ],
  },
  {
    id: "apt-quant-m",
    subject: "Aptitude", topic: "Quantitative", difficulty: "Medium",
    questions: [
      { q: "15% of 200?", options: ["25", "30", "35", "45"], answer: 1 },
      { q: "If 3x=27, x=?", options: ["3", "6", "9", "12"], answer: 2 },
      { q: "LCM of 4 and 6?", options: ["12", "10", "24", "8"], answer: 0 },
      { q: "Speed=60kmph, time=2h, distance?", options: ["30", "90", "120", "150"], answer: 2 },
      { q: "Simple interest on 1000 at 10% for 2y?", options: ["100", "150", "200", "250"], answer: 2 },
    ],
  },
];

// ============================================================================
// UDAAN MISSION: FREE DIGITAL SCHOOL BAG RESOURCES
// Openly licensed, verified curriculum materials with offline & low-bandwidth support
// ============================================================================

export const SEED_UDAAN_RESOURCES: UdaanResource[] = [
  {
    id: "udaan-res-1",
    title: "Laws of Motion & Inertia — Complete Chapter Notes",
    titleHi: "गति के नियम एवं जड़त्व — संपूर्ण अध्याय नोट्स",
    classGrade: "Class 9",
    subject: "Science",
    chapter: "Force and Laws of Motion",
    language: "bilingual",
    resourceType: "notes",
    sourceType: "official_open",
    openLicense: "Creative Commons BY-SA 4.0 / NCERT Open Educational Resource",
    fileSizeBytes: 24500,
    downloadCount: 3410,
    verifiedBy: "Udaan Academic Council",
    createdAt: "2026-09-01T00:00:00.000Z",
    content: `# Force and Laws of Motion (बल तथा गति के नियम)
Class 9 Science — Chapter 9

## 1. What is Force? (बल क्या है?)
A push or pull upon an object resulting from its interaction with another object.
- **SI Unit:** Newton ($N$ or $kg\\cdot m/s^2$)
- **Effects of Force:** Can change speed, direction of motion, or shape of an object.

## 2. First Law of Motion (Inertia) — गति का प्रथम नियम
An object continues to remain at rest or in a state of uniform motion along a straight line unless acted upon by an external unbalanced force.
- **Inertia (जड़त्व):** The natural tendency of objects to resist a change in their state of rest or motion.
- Mass is a quantitative measure of inertia. Greater mass = greater inertia.
- **Daily life example:** When a bus suddenly accelerates forward, passengers lean backwards because of inertia of rest.

## 3. Second Law of Motion — गति का द्वितीय नियम
The rate of change of momentum of an object is proportional to the applied unbalanced force in the direction of force.
- **Mathematical Form:** $F = m \\cdot a$
- **Momentum ($p$):** Mass $\\times$ Velocity ($p = m \\cdot v$), unit is $kg\\cdot m/s$.
- **Why a fielder pulls hands back:** Increasing time reduces the impact force on hands ($F = \\Delta p / \\Delta t$).

## 4. Third Law of Motion — गति का तृतीय नियम
To every action, there is an equal and opposite reaction; they act on two different bodies.
- Action and reaction forces never cancel each other because they act on different objects.
- **Example:** Rocket propulsion — expelling exhaust gases downwards propels the rocket upward.

## Quick Summary for Revision:
1. $F = m \\cdot a$
2. Momentum $p = m \\cdot v$
3. Total momentum is conserved in an isolated system (Conservation of Momentum).`,
  },
  {
    id: "udaan-res-2",
    title: "Chemical Reactions & Equations — Formula & Reaction Sheet",
    titleHi: "रासायनिक अभिक्रियाएँ एवं समीकरण — सूत्र एवं अभिक्रिया पत्र",
    classGrade: "Class 10",
    subject: "Chemistry",
    chapter: "Chemical Reactions and Equations",
    language: "en",
    resourceType: "summary",
    sourceType: "official_open",
    openLicense: "NCERT Open Curriculum / Creative Commons CC-BY 4.0",
    fileSizeBytes: 18200,
    downloadCount: 4890,
    verifiedBy: "State Board Science Panel",
    createdAt: "2026-09-05T00:00:00.000Z",
    content: `# Chemical Reactions & Equations — Quick Revision Summary
Class 10 Science — Chapter 1

## 5 Types of Chemical Reactions:
1. **Combination Reaction:**
   Two or more reactants combine to form a single product.
   $CaO(s) + H_2O(l) \\rightarrow Ca(OH)_2(aq) + \\text{Heat}$ (Quicklime to Slaked lime)
2. **Decomposition Reaction:**
   A single compound breaks down into two or more simpler substances upon heating/light/electricity.
   $2FeSO_4(s) \\xrightarrow{\\Delta} Fe_2O_3(s) + SO_2(g) + SO_3(g)$
3. **Displacement Reaction:**
   More reactive element displaces a less reactive element.
   $Fe(s) + CuSO_4(aq) \\rightarrow FeSO_4(aq) + Cu(s)$
4. **Double Displacement (Precipitation):**
   Exchange of ions between reactants.
   $Na_2SO_4(aq) + BaCl_2(aq) \\rightarrow BaSO_4(s)\\downarrow + 2NaCl(aq)$ (White ppt of $BaSO_4$)
5. **Redox Reactions (Oxidation & Reduction):**
   - Oxidation: Gain of oxygen or loss of hydrogen.
   - Reduction: Loss of oxygen or gain of hydrogen.

## Corrosion & Rancidity:
- **Rusting of Iron:** $4Fe + 3O_2 + 2xH_2O \\rightarrow 2Fe_2O_3\\cdot xH_2O$
- **Prevention of Rancidity:** Adding antioxidants, flushing bags with nitrogen gas.`,
  },
  {
    id: "udaan-res-3",
    title: "प्रकाश — परावर्तन तथा अपवर्तन (Light — Reflection and Refraction)",
    titleHi: "प्रकाश — परावर्तन तथा अपवर्तन संपूर्ण हिन्दी नोट्स",
    classGrade: "Class 10",
    subject: "Physics",
    chapter: "Light - Reflection and Refraction",
    language: "hi",
    resourceType: "notes",
    sourceType: "official_open",
    openLicense: "NCERT Hindi Open Curriculum / CC-BY-SA",
    fileSizeBytes: 28900,
    downloadCount: 5210,
    verifiedBy: "Hindi Shiksha Parishad",
    createdAt: "2026-09-10T00:00:00.000Z",
    content: `# प्रकाश — परावर्तन तथा अपवर्तन
कक्षा 10 विज्ञान — अध्याय 10 (हिन्दी माध्यम)

## 1. प्रकाश का परावर्तन (Reflection of Light)
जब प्रकाश किसी चिकने या चमकदार पृष्ठ से टकराकर उसी माध्यम में लौटता है, तो इसे परावर्तन कहते हैं।
- **परावर्तन के नियम:**
  1. आपतन कोण ($i$) सदैव परावर्तन कोण ($r$) के बराबर होता है: $\\angle i = \\angle r$
  2. आपतित किरण, दर्पण के आपतन बिंदु पर अभिलंब तथा परावर्तित किरण — सभी एक ही तल में होते हैं।

## 2. गोलीय दर्पण (Spherical Mirrors)
- **अवतल दर्पण (Concave Mirror):** परावर्तक पृष्ठ अंदर की ओर धंसा होता है। वास्तविक व उल्टा प्रतिबिम्ब बनाता है (एक स्थिति छोड़कर जब वस्तु $P$ और $F$ के बीच हो)।
  - *उपयोग:* टॉर्च, सर्चलाइट, सोलर कुकर, दंत चिकित्सकों द्वारा।
- **उत्तल दर्पण (Convex Mirror):** परावर्तक पृष्ठ बाहर की ओर उभरा होता है। सदैव सीधा, आभासी और छोटा प्रतिबिम्ब बनाता है।
  - *उपयोग:* वाहनों का पश्च-दृश्य दर्पण (Rear-view mirror)।

## 3. दर्पण सूत्र एवं आवर्धन (Mirror Formula):
$$\\frac{1}{f} = \\frac{1}{v} + \\frac{1}{u}$$
- आवर्धन $m = -\\frac{v}{u} = \\frac{h'}{h}$

## 4. प्रकाश का अपवर्तन (Refraction of Light):
- **स्नेल का नियम (Snell's Law):** $\\frac{\\sin i}{\\sin r} = \\text{स्थिरांक} (n)$
- **लेंस सूत्र (Lens Formula):**
$$\\frac{1}{f} = \\frac{1}{v} - \\frac{1}{u}$$
- लेंस की क्षमता $P = \\frac{1}{f(\\text{मीटर में})}$, मात्रक **डायोप्टर (D)** है।`,
  },
  {
    id: "udaan-res-4",
    title: "Calculus Derivatives & Limits — Step-by-Step Practice Set",
    titleHi: "कलन अवकलन एवं सीमा — चरणबद्ध अभ्यास प्रश्न",
    classGrade: "Class 12",
    subject: "Mathematics",
    chapter: "Continuity and Differentiability",
    language: "en",
    resourceType: "practice_questions",
    sourceType: "official_open",
    openLicense: "Creative Commons BY-SA 4.0 / OpenStax Mathematics",
    fileSizeBytes: 22100,
    downloadCount: 2950,
    verifiedBy: "National STEM Faculty",
    createdAt: "2026-09-12T00:00:00.000Z",
    content: `# Differentiability & Derivatives Practice Set
Class 12 Mathematics & Competitive Foundation

## Core Formula Sheet:
1. $\\frac{d}{dx}(x^n) = n x^{n-1}$
2. $\\frac{d}{dx}(\\sin x) = \\cos x$
3. $\\frac{d}{dx}(\\cos x) = -\\sin x$
4. $\\frac{d}{dx}(e^x) = e^x$
5. $\\frac{d}{dx}(\\ln x) = \\frac{1}{x}$
6. Product Rule: $(u\\cdot v)' = u'v + uv'$
7. Quotient Rule: $(\\frac{u}{v})' = \\frac{u'v - uv'}{v^2}$
8. Chain Rule: $\\frac{dy}{dx} = \\frac{dy}{du}\\cdot \\frac{du}{dx}$

## Solved Practice Questions:
**Question 1:** Find $\\frac{dy}{dx}$ if $y = \\sin(x^2 + 5)$.
- *Step 1:* Identify outer function $f(u) = \\sin u$ where $u = x^2 + 5$.
- *Step 2:* $\\frac{df}{du} = \\cos u = \\cos(x^2 + 5)$.
- *Step 3:* Differentiate inner function: $\\frac{du}{dx} = 2x$.
- *Step 4:* Apply Chain Rule: $\\frac{dy}{dx} = 2x\\cos(x^2 + 5)$. *(Answer)*

**Question 2:** Find derivative of $y = x^3 e^x$.
- *Step 1:* Product rule with $u = x^3, v = e^x$.
- *Step 2:* $u' = 3x^2, v' = e^x$.
- *Step 3:* $\\frac{dy}{dx} = 3x^2 e^x + x^3 e^x = x^2 e^x (3 + x)$. *(Answer)*`,
  },
  {
    id: "udaan-res-5",
    title: "Life Processes — Nutrition, Respiration & Circulation Summary",
    titleHi: "जैव प्रक्रम — पोषण, श्वसन एवं परिसंचरण सारांश",
    classGrade: "Class 10",
    subject: "Biology",
    chapter: "Life Processes",
    language: "bilingual",
    resourceType: "summary",
    sourceType: "official_open",
    openLicense: "NCERT Open Educational Content / CC-BY-SA",
    fileSizeBytes: 26400,
    downloadCount: 3880,
    verifiedBy: "State Board Life Sciences Panel",
    createdAt: "2026-09-15T00:00:00.000Z",
    content: `# Life Processes (जैव प्रक्रम)
Class 10 Biology — Complete Essential Notes

## 1. Autotrophic Nutrition (स्वपोषी पोषण)
Plants synthesize food using carbon dioxide, water, and sunlight trapped by chlorophyll:
$$6CO_2 + 12H_2O \\xrightarrow[\\text{Chlorophyll}]{\\text{Sunlight}} C_6H_{12}O_6 + 6O_2 + 6H_2O$$
- Light reaction produces ATP and $NADPH$.
- Stomata pores regulate gas exchange via guard cells.

## 2. Respiration (श्वसन):
Breakdown of glucose ($C_6H_{12}O_6$) into pyruvate in cytoplasm:
- **Aerobic (ऑक्सी श्वसन):** Occurs in Mitochondria in presence of $O_2$. Yields $36-38$ ATP, $CO_2$, and $H_2O$.
- **Anaerobic (अनाक्सी श्वसन):**
  - In Yeast: Ethanol + $CO_2$ + 2 ATP (Fermentation).
  - In Human Muscles (during intense sprint): Lactic acid + 2 ATP (causes muscle cramps).

## 3. Human Transportation (मानव परिसंचरण):
- **Double Circulation:** Blood flows through the heart twice during each complete cycle (Pulmonary and Systemic circulation).
- Heart has 4 chambers preventing mixing of oxygenated and deoxygenated blood.
- Blood pressure is measured with a Sphygmomanometer (Normal: $120/80$ mmHg).`,
  },
  {
    id: "udaan-res-6",
    title: "Python Programming & DSA Basics for Young Coders",
    titleHi: "पायथन प्रोग्रामिंग एवं डेटा स्ट्रक्चर मूलभूत",
    classGrade: "Foundation / College",
    subject: "Computer Science",
    chapter: "Introduction to Algorithms & Python",
    language: "en",
    resourceType: "notes",
    sourceType: "community_verified",
    openLicense: "Creative Commons CC-BY 4.0 / Open Source Educator Collective",
    fileSizeBytes: 19800,
    downloadCount: 4120,
    verifiedBy: "Community Tech Mentors",
    createdAt: "2026-09-20T00:00:00.000Z",
    content: `# Python & DSA Fundamentals
For Students Beginning Computer Science (Free & Accessible)

## 1. Python Basics in 5 Minutes:
\`\`\`python
# Variables & Conditions
age = 16
if age >= 18:
    print("Eligible to vote")
else:
    print("Keep learning!")

# Loops & Lists
fruits = ["apple", "banana", "guava", "mango"]
for fruit in fruits:
    print(f"Fresh: {fruit}")
\`\`\`

## 2. Linear Search vs Binary Search:
- **Linear Search:** Checks each element from index 0 to $N-1$. Time: $O(N)$.
- **Binary Search:** Operates on *sorted* arrays by repeatedly halving the search space. Time: $O(\\log N)$.

\`\`\`python
def binary_search(arr, target):
    low = 0
    high = len(arr) - 1
    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == target:
            return mid  # Found at index
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1  # Not found
\`\`\`

## Practice Challenge:
Write a function that reverses an array in-place using two pointers ($O(1)$ extra space).`,
  },
  {
    id: "udaan-res-7",
    title: "The Making of the Indian Constitution — Civic Foundations",
    titleHi: "भारतीय संविधान का निर्माण — नागरिक शास्त्र आधार",
    classGrade: "Class 8",
    subject: "History & Civics",
    chapter: "The Indian Constitution",
    language: "bilingual",
    resourceType: "notes",
    sourceType: "official_open",
    openLicense: "NCERT Open Curriculum / Public Domain Govt Archive",
    fileSizeBytes: 21300,
    downloadCount: 2100,
    verifiedBy: "Social Science Forum",
    createdAt: "2026-09-25T00:00:00.000Z",
    content: `# The Indian Constitution (भारतीय संविधान)
Class 8 Civics — Essential Study Summary

## 1. Why Does a Country Need a Constitution?
- Lays out ideals that all citizens agree to live by.
- Defines the nature of a country's political system.
- Provides safeguards against the misuse of power by political leaders.
- Protects minority groups from domination by the majority.

## 2. Key Features of the Indian Constitution:
1. **Federalism (संघवाद):** More than one level of government (Center, State, and Panchayati Raj).
2. **Parliamentary Form of Government:** Universal Adult Suffrage — every adult citizen has the right to vote regardless of wealth or background.
3. **Separation of Powers:** Legislature, Executive, and Judiciary prevent tyrannical centralization.
4. **Fundamental Rights (मौलिक अधिकार):** The "conscience" of the Constitution:
   - Right to Equality (Articles 14-18)
   - Right to Freedom (Articles 19-22)
   - Right against Exploitation (Articles 23-24)
   - Right to Freedom of Religion (Articles 25-28)
   - Cultural and Educational Rights (Articles 29-30)
   - Right to Constitutional Remedies (Article 32)
5. **Secularism (धर्मनिरपेक्षता):** State does not officially promote any one religion.

## Key Trivia:
- Constituent Assembly took 2 years, 11 months, and 18 days to draft the Constitution.
- Dr. B.R. Ambedkar is honored as the Father of the Indian Constitution.`,
  },
  {
    id: "udaan-res-8",
    title: "Linear Equations in Two Variables — Solved Problem Bank",
    titleHi: "दो चरों वाले रैखिक समीकरण — हल सहित प्रश्न बैंक",
    classGrade: "Class 10",
    subject: "Mathematics",
    chapter: "Pair of Linear Equations in Two Variables",
    language: "en",
    resourceType: "practice_questions",
    sourceType: "community_verified",
    openLicense: "Creative Commons BY-SA 4.0 / Community Math Circle",
    fileSizeBytes: 20500,
    downloadCount: 3120,
    verifiedBy: "Educator Peer Review",
    createdAt: "2026-09-28T00:00:00.000Z",
    content: `# Pair of Linear Equations in Two Variables
Standard Form:
$a_1 x + b_1 y + c_1 = 0$
$a_2 x + b_2 y + c_2 = 0$

## Condition for Solutions:
1. **Unique Solution (Intersecting lines):**
   $\\frac{a_1}{a_2} \\neq \\frac{b_1}{b_2}$ (Consistent)
2. **Infinitely Many Solutions (Coincident lines):**
   $\\frac{a_1}{a_2} = \\frac{b_1}{b_2} = \\frac{c_1}{c_2}$ (Consistent & Dependent)
3. **No Solution (Parallel lines):**
   $\\frac{a_1}{a_2} = \\frac{b_1}{b_2} \\neq \\frac{c_1}{c_2}$ (Inconsistent)

## Solved Example (Elimination Method):
Solve:
1) $2x + 3y = 11$
2) $2x - 4y = -24$

- *Subtract (2) from (1):*
  $(2x + 3y) - (2x - 4y) = 11 - (-24)$
  $7y = 35 \\implies y = 5$
- *Substitute $y = 5$ into (1):*
  $2x + 3(5) = 11 \\implies 2x = 11 - 15 = -4 \\implies x = -2$
- *Solution:* $x = -2, y = 5$.`,
  },
];

// ============================================================================
// UDAAN MISSION: COMMUNITY LEARNING BANK
// Safe, privacy-preserving sharing of physical textbooks, calculators & devices
// ============================================================================

export const SEED_COMMUNITY_LISTINGS: UdaanCommunityItem[] = [
  {
    id: "bank-item-1",
    title: "Class 10 NCERT Science & Mathematics Textbooks (Full Set)",
    category: "books",
    itemCondition: "Gently Used",
    generalArea: "North Delhi, Rohini Zone",
    safeHandoverPoint: "District Central Library, Sector 3 Reading Hall",
    status: "Available",
    verificationStatus: "Verified Listing",
    listedByRole: "Alumni Donor",
    description: "Good condition NCERT books for Class 10. Clean pages without heavy markings. Free for any student preparing for board examinations.",
    safetyGuidelines: "Handover strictly at public library desk during daylight hours. No contact details shared.",
    reportsCount: 0,
    createdAt: "2026-10-01T10:00:00.000Z",
  },
  {
    id: "bank-item-2",
    title: "Scientific Calculator — Casio fx-82MS (Working with Fresh Battery)",
    category: "calculator",
    itemCondition: "Gently Used",
    generalArea: "Bengaluru South, Jayanagar",
    safeHandoverPoint: "Govt PU College Gate / Security Desk",
    status: "Available",
    verificationStatus: "Verified Listing",
    listedByRole: "Student",
    description: "Completed college semester 1 and 2 engineering mathematics. Clean calculator with protective cover. Ready for someone who needs it.",
    safetyGuidelines: "Handover coordinated through college security desk or library gate. Dignified and respectful peer sharing.",
    reportsCount: 0,
    createdAt: "2026-10-05T14:30:00.000Z",
  },
  {
    id: "bank-item-3",
    title: "Geometry Box & Unused Grid Notebooks (Set of 4)",
    category: "stationery",
    itemCondition: "Brand New",
    generalArea: "Lucknow, Gomti Nagar",
    safeHandoverPoint: "Panchayat Bhavan / Community Learning Center",
    status: "Available",
    verificationStatus: "Verified Listing",
    listedByRole: "Teacher",
    description: "Brand new geometry kit with compass, protractor, scales, and four clean spiral notebooks. Donated by school alumni for community students.",
    safetyGuidelines: "Collection at Community Learning Center during operational hours.",
    reportsCount: 0,
    createdAt: "2026-10-10T09:15:00.000Z",
  },
  {
    id: "bank-item-4",
    title: "Class 11 & 12 Physics & Chemistry Reference Guides",
    category: "books",
    itemCondition: "Fair",
    generalArea: "Patna, Kankarbagh",
    safeHandoverPoint: "Public Reading Hall, Near Gandhi Murti",
    status: "Requested",
    verificationStatus: "Verified Listing",
    listedByRole: "Student",
    description: "Past year questions book and concept notes for Class 11-12 physics and chemistry. Covers formulas and solved examples.",
    safetyGuidelines: "Handover at public library reading hall.",
    reportsCount: 0,
    createdAt: "2026-10-14T11:45:00.000Z",
  },
  {
    id: "bank-item-5",
    title: "Refurbished 8-inch Android Study Tablet with Offline Reader",
    category: "device",
    itemCondition: "Gently Used",
    generalArea: "Bhopal, MP Nagar",
    safeHandoverPoint: "Community Digital Library Desk",
    status: "Available",
    verificationStatus: "Verified Listing",
    listedByRole: "NGO Partner",
    description: "Donated corporate tablet tested and wiped clean. Ideal for reading PDF notes and using offline study tools. Comes with charger.",
    safetyGuidelines: "Must be collected with school/teacher endorsement letter at Community Digital Library desk. No fees permitted.",
    reportsCount: 0,
    createdAt: "2026-10-18T16:00:00.000Z",
  },
];

// ============================================================================
// UDAAN MISSION: SCHOLARSHIP AND OPPORTUNITY CORNER
// Genuine, verified governmental and institutional educational opportunities
// ============================================================================

export const SEED_SCHOLARSHIPS: UdaanOpportunity[] = [
  {
    id: "opp-1",
    title: "PM YASASVI Scholarship Scheme (Vibrant India)",
    titleHi: "प्रधानमंत्री यशस्वी छात्रवृत्ति योजना",
    organization: "Ministry of Social Justice & Empowerment, Govt of India",
    level: "Class 9-10",
    category: "Scholarship",
    benefit: "Up to ₹75,000 per annum (Class 9-10) and ₹1,25,000 per annum (Class 11-12)",
    eligibilitySummary: "OBC, EBC, and DNT students studying in Class 9 or 11 in recognized Top Class Schools with annual family income up to ₹2.5 Lakh.",
    officialLink: "https://yet.nta.ac.in",
    deadline: "Annual Window: Usually opens July–August, closes September–October",
    verificationDate: "October 2026",
    verificationStatus: "Official Verified",
    applicationSteps: [
      "1. Register online on the National Testing Agency (NTA) YASASVI portal or National Scholarship Portal.",
      "2. Upload student photograph, school enrollment proof, and self-certified family income declaration.",
      "3. Selected students receive direct benefit transfer (DBT) directly into their Aadhaar-linked bank account.",
      "4. Free preparation notes and syllabus are available in the Udaan Digital School Bag.",
    ],
  },
  {
    id: "opp-2",
    title: "National Means-cum-Merit Scholarship Scheme (NMMSS)",
    titleHi: "राष्ट्रीय साधन-सह-योग्यता छात्रवृत्ति योजना (NMMSS)",
    organization: "Department of School Education & Literacy, Ministry of Education, Govt of India",
    level: "Class 9-10",
    category: "Scholarship",
    benefit: "₹12,000 per annum (₹1,000 per month) for 4 years (Class 9 through Class 12)",
    eligibilitySummary: "Students of Government, Local Body, and Government-aided schools who scored 55%+ in Class 7 and whose parental income is under ₹3.5 Lakh/yr.",
    officialLink: "https://scholarships.gov.in",
    deadline: "Annual National Scholarship Portal (NSP) window: Typically August – November",
    verificationDate: "October 2026",
    verificationStatus: "Official Verified",
    applicationSteps: [
      "1. Appear for the State-level NMMSS examination conducted in Class 8 (Mental Ability Test + Scholastic Aptitude Test).",
      "2. Qualifying candidates register on the National Scholarship Portal (scholarships.gov.in).",
      "3. School Headmaster / Principal verifies the student's enrollment on the NSP institute portal.",
      "4. Renewal occurs annually upon advancing to Class 10, 11, and 12 with at least 55% marks.",
    ],
  },
  {
    id: "opp-3",
    title: "AICTE Pragati Scholarship Scheme for Girls",
    titleHi: "एआईसीटीई प्रगति बालिका छात्रवृत्ति",
    organization: "All India Council for Technical Education (AICTE)",
    level: "College / Undergraduate",
    category: "Scholarship",
    benefit: "₹50,000 per annum for tuition, books, computer, and academic fees",
    eligibilitySummary: "Female students admitted to 1st year of AICTE-approved Technical Degree or Diploma course with family income less than ₹8 Lakh/annum. Up to 2 girls per family.",
    officialLink: "https://www.aicte-india.org/schemes/students-development-schemes/Pragati",
    deadline: "Annual NSP Application Window: Usually October – December",
    verificationDate: "October 2026",
    verificationStatus: "Official Verified",
    applicationSteps: [
      "1. Secure admission to an AICTE-approved engineering/polytechnic diploma or degree institution.",
      "2. Apply under AICTE scheme on National Scholarship Portal (NSP).",
      "3. Submit institute admission letter, mark sheets, and Aadhaar-linked bank details.",
      "4. Grant disbursed directly to the student via DBT.",
    ],
  },
  {
    id: "opp-4",
    title: "SWAYAM & NPTEL Free Online Courses with Certification Assistance",
    titleHi: "स्वयं (SWAYAM) एवं एनपीटीईएल निःशुल्क ऑनलाइन पाठ्यक्रम",
    organization: "Ministry of Education & IIT Consortium",
    level: "All Students",
    category: "Free Course",
    benefit: "Free access to 2,000+ courses by IIT and IIM professors; fee waiver available for proctored exam",
    eligibilitySummary: "Open to every student from Class 9 to Postgraduate level with zero registration fee. Courses cover Science, Engineering, Humanities, and Commerce.",
    officialLink: "https://swayam.gov.in",
    deadline: "Two sessions annually: January Semester and July Semester",
    verificationDate: "October 2026",
    verificationStatus: "Official Verified",
    applicationSteps: [
      "1. Visit swayam.gov.in and create a free account with Google or email.",
      "2. Browse course catalog and click 'Enroll' on any desired course for free.",
      "3. Watch video lectures, download transcripts, and submit weekly non-graded assignments.",
      "4. Government school students can apply for fee waiver for final proctored exam through their institution.",
    ],
  },
  {
    id: "opp-5",
    title: "Vidyasaarathi Free Education Support Programs",
    titleHi: "विद्यासारथी शिक्षा छात्रवृत्ति कार्यक्रम",
    organization: "Protean eGov Technologies & Corporate CSR Alliances",
    level: "All Students",
    category: "Scholarship",
    benefit: "Tuition support ranging from ₹10,000 to ₹50,000 depending on course and corporate sponsor",
    eligibilitySummary: "Students from economically weaker sections enrolled in ITI, Polytechnic, General Graduation, or Engineering with 50%+ previous marks.",
    officialLink: "https://www.vidyasaarathi.co.in",
    deadline: "Rolling applications throughout the academic year depending on corporate schemes",
    verificationDate: "October 2026",
    verificationStatus: "Official Verified",
    applicationSteps: [
      "1. Sign up on vidyasaarathi.co.in with mobile number and email.",
      "2. Complete student profile with past academic marks and current course.",
      "3. System matches student with active corporate scholarship schemes.",
      "4. Apply directly without paying any application fee.",
    ],
  },
  {
    id: "opp-6",
    title: "Google Generation Scholarship (Asia Pacific)",
    titleHi: "गूगल जनरेशन छात्रवृत्ति (कंप्यूटर साइंस)",
    organization: "Google",
    level: "College / Undergraduate",
    category: "Competition / Fellowship",
    benefit: "$2,500 USD (Approx ₹2,00,000) for tuition, books, and study devices + Google mentorship",
    eligibilitySummary: "Undergraduate women enrolled in Computer Science, Computer Engineering, or related technical degrees who demonstrate academic excellence and leadership.",
    officialLink: "https://buildyourfuture.withgoogle.com/scholarships/generation-google-scholarship-apac",
    deadline: "Annual Application Window: Typically Spring (March – May)",
    verificationDate: "October 2026",
    verificationStatus: "Official Verified",
    applicationSteps: [
      "1. Prepare resume, college transcript, and responses to two short essay questions on technology and community impact.",
      "2. Submit online application on Google Build Your Future portal.",
      "3. Shortlisted candidates participate in online problem-solving assessment.",
      "4. Awardees receive funding and invitation to virtual Google retreat.",
    ],
  },
];

// ============================================================================
// UDAAN MISSION: VERIFIED CURRICULUM KNOWLEDGE BANK EXPLANATIONS
// Honest, prewritten, step-by-step explanations for when AI is offline or key is unconfigured
// ============================================================================

export const VERIFIED_KNOWLEDGE_EXPLANATIONS: Record<
  string,
  {
    title: string;
    explanation: string;
    steps: string[];
    practiceQuestion: {
      question: string;
      options?: string[];
      answer: string;
      hint: string;
    };
  }
> = {
  kinematics: {
    title: "Kinematics — 1D Motion with Constant Acceleration",
    explanation:
      "Kinematics describes motion without considering its causes. In 1D motion with uniform acceleration $a$, we use 3 fundamental equations derived from calculus:\n1. $v = u + at$\n2. $s = ut + \\frac{1}{2}at^2$\n3. $v^2 = u^2 + 2as$\n\nWhere $u$ is initial velocity, $v$ is final velocity, $a$ is acceleration, $t$ is time, and $s$ is displacement.",
    steps: [
      "Step 1: Choose a coordinate axis and define the positive direction (e.g., upward = +y).",
      "Step 2: List the known variables ($u, v, a, s, t$) with their proper mathematical signs.",
      "Step 3: Select the formula that contains your target unknown and excludes the missing parameter.",
      "Step 4: Solve algebraically before substituting numerical quantities.",
    ],
    practiceQuestion: {
      question: "A car accelerating from rest at 2 m/s² travels for 5 seconds. What is its displacement?",
      options: ["10 m", "25 m", "50 m", "100 m"],
      answer: "25 m (using s = ut + 0.5*a*t² where u=0: s = 0 + 0.5 * 2 * 25 = 25m)",
      hint: "Initial velocity u is 0 since it starts from rest.",
    },
  },
  newton: {
    title: "Newton's Laws of Motion — Fundamentals",
    explanation:
      "Sir Isaac Newton formulated 3 laws governing physical motion:\n• 1st Law (Inertia): Objects maintain velocity unless acted upon by an external net force.\n• 2nd Law: Net force equals mass times acceleration ($F = ma$).\n• 3rd Law: Action and reaction forces are equal in magnitude and opposite in direction on two interacting bodies.",
    steps: [
      "Step 1: Draw a Free Body Diagram (FBD) isolating the object.",
      "Step 2: Identify all real contact and field forces (gravity, normal force, friction, tension).",
      "Step 3: Resolve forces into x and y components.",
      "Step 4: Apply $\\Sigma F_x = m a_x$ and $\\Sigma F_y = m a_y$.",
    ],
    practiceQuestion: {
      question: "A net force of 15 N is applied to a 3 kg mass. What is the resulting acceleration?",
      options: ["3 m/s²", "5 m/s²", "18 m/s²", "45 m/s²"],
      answer: "5 m/s² (from a = F/m = 15/3 = 5 m/s²)",
      hint: "Use F = m * a.",
    },
  },
  chemistry: {
    title: "Chemical Balancing & Conservation of Mass",
    explanation:
      "According to the Law of Conservation of Mass, atoms can neither be created nor destroyed in a chemical reaction. Therefore, the number of atoms of each element must remain equal on both reactant and product sides.",
    steps: [
      "Step 1: Write the unbalanced skeletal equation with correct chemical formulas.",
      "Step 2: Count the atoms of each element on both sides of the reaction.",
      "Step 3: Balance elements appearing in only one compound first (usually metals and non-metals).",
      "Step 4: Balance hydrogen and oxygen atoms last.",
      "Step 5: Verify that all coefficients are the smallest whole numbers.",
    ],
    practiceQuestion: {
      question: "What is the coefficient of O₂ when balancing C₃H₈ + O₂ → CO₂ + H₂O?",
      options: ["3", "4", "5", "10"],
      answer: "5 (balanced reaction: C₃H₈ + 5O₂ → 3CO₂ + 4H₂O)",
      hint: "Balance Carbon (3), then Hydrogen (8 -> 4 H₂O), then count total Oxygens: 3*2 + 4 = 10, so 5 O₂.",
    },
  },
  calculus: {
    title: "Calculus — Differentiation & Power Rule",
    explanation:
      "The derivative measures the instantaneous rate of change of a function. For polynomial terms of the form $f(x) = x^n$, the Power Rule states that $\\frac{d}{dx}(x^n) = n x^{n-1}$.",
    steps: [
      "Step 1: Express roots and reciprocals as fractional or negative powers ($1/x = x^{-1}, \\sqrt{x} = x^{1/2}$).",
      "Step 2: Multiply by the exponent $n$.",
      "Step 3: Reduce the original exponent by 1 ($n - 1$).",
      "Step 4: Differentiate constants to zero.",
    ],
    practiceQuestion: {
      question: "What is the derivative of f(x) = 4x³ - 5x + 7?",
      options: ["12x² - 5", "12x³ - 5", "4x² - 5", "12x²"],
      answer: "12x² - 5 (4*3x² - 5*1 + 0 = 12x² - 5)",
      hint: "Differentiate each term independently: d/dx(4x³) = 12x², d/dx(-5x) = -5, d/dx(7) = 0.",
    },
  },
  biology: {
    title: "Cell Structure — Plant vs Animal Cells",
    explanation:
      "The cell is the basic structural and functional unit of all living organisms. Plant and animal cells share organelles like the nucleus, mitochondria, endoplasmic reticulum, and Golgi apparatus, but differ in key protective and photosynthetic structures.",
    steps: [
      "Step 1: Plant cells have a rigid cellulose Cell Wall; animal cells have only a plasma membrane.",
      "Step 2: Plant cells contain Chloroplasts for photosynthesis; animal cells do not.",
      "Step 3: Plant cells have a large central Vacuole; animal cells have small, transient vacuoles.",
      "Step 4: Animal cells typically possess Centrioles for cell division; plant cells do not.",
    ],
    practiceQuestion: {
      question: "Which organelle is responsible for aerobic cellular respiration and ATP generation?",
      options: ["Nucleus", "Mitochondria", "Ribosome", "Endoplasmic Reticulum"],
      answer: "Mitochondria (the powerhouse of the cell)",
      hint: "It produces ATP via the Krebs cycle and oxidative phosphorylation.",
    },
  },
  coding: {
    title: "Binary Search Algorithm — Logarithmic Efficiency",
    explanation:
      "Binary search is a divide-and-conquer search algorithm that locates the position of a target value within a *sorted* array. In each iteration, it compares the target with the middle element, discarding half the search interval.",
    steps: [
      "Step 1: Set low = 0 and high = len(arr) - 1.",
      "Step 2: Calculate mid = low + (high - low) // 2.",
      "Step 3: If arr[mid] == target, return index mid.",
      "Step 4: If target > arr[mid], narrow search to right half (low = mid + 1).",
      "Step 5: If target < arr[mid], narrow search to left half (high = mid - 1).",
      "Step 6: If low exceeds high, element is not present (return -1).",
    ],
    practiceQuestion: {
      question: "What is the maximum number of comparisons to search a sorted list of 1,024 elements with binary search?",
      options: ["10", "100", "512", "1024"],
      answer: "10 (since log₂(1024) = 10)",
      hint: "2¹⁰ = 1024.",
    },
  },
};

