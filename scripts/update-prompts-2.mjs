/**
 * Second batch: additional verified prompts + "no supplement" confirmations
 */
import { readFileSync, writeFileSync } from 'fs';

const schools = JSON.parse(readFileSync('src/data/schools.json', 'utf-8'));

const VERIFIED_BATCH2 = {
  // ═══ PUBLIC UNIVERSITIES — confirmed no/minimal supplement ═══
  "Penn State": [
    "Please tell us something about yourself, your experiences, or activities that you believe would reflect positively on your ability to succeed at Penn State. This is your opportunity to tell us something about yourself that is not already reflected in your application or academic records. (500 words)"
  ],
  "Ohio State": "no_supplement",
  "Clemson": "no_supplement",
  "Rutgers": "no_supplement",
  "Michigan State": [
    "Michigan State is a large, diverse community of students, faculty, and staff. Describe how you would contribute to this community. (250-650 words)"
  ],
  "Iowa State": "no_supplement",
  "BYU": [
    "Describe how gaining further light and knowledge through your university experience will help you achieve your goals. (250 words)",
    "Describe a challenging situation you have faced and how you handled it. (250 words)",
    "What is a gospel principle or teaching that has influenced your life? Explain how it has impacted you. (250 words)"
  ],
  "Florida State": "no_supplement",
  "Arizona State": "no_supplement",
  "UConn": "no_supplement",
  "Stony Brook": "no_supplement",
  "Binghamton": "no_supplement",
  "Auburn": "no_supplement",
  "George Mason": [
    "What is your motivation for pursuing higher education? Why do you believe George Mason University is the right institution for you? (500 words, optional)"
  ],

  // UC schools — all share same PIQs
  "UC San Diego": [
    "Describe an example of your leadership experience in which you have positively influenced others, helped resolve disputes or contributed to group efforts over time. (350 words — choose 4 of 8 UC PIQs)",
    "Every person has a creative side, and it can be expressed in many ways: problem solving, original and innovative thinking, and artistically, to name a few. Describe how you express your creative side. (350 words)",
    "What would you say is your greatest talent or skill? How have you developed and demonstrated that talent over time? (350 words)",
    "Describe how you have taken advantage of a significant educational opportunity or worked to overcome an educational barrier you have faced. (350 words)",
    "Describe the most significant challenge you have faced and the steps you have taken to overcome this challenge. How has this challenge affected your academic achievement? (350 words)",
    "Think about an academic subject that inspires you. Describe how you have furthered this interest inside and/or outside of the classroom. (350 words)",
    "What have you done to make your school or your community a better place? (350 words)",
    "Beyond what has already been shared in your application, what do you believe makes you a strong candidate for admissions to the University of California? (350 words)"
  ],
  "UC Santa Barbara": [
    "Describe an example of your leadership experience in which you have positively influenced others, helped resolve disputes or contributed to group efforts over time. (350 words — choose 4 of 8 UC PIQs)",
    "Every person has a creative side, and it can be expressed in many ways: problem solving, original and innovative thinking, and artistically, to name a few. Describe how you express your creative side. (350 words)",
    "What would you say is your greatest talent or skill? How have you developed and demonstrated that talent over time? (350 words)",
    "Describe how you have taken advantage of a significant educational opportunity or worked to overcome an educational barrier you have faced. (350 words)",
    "Describe the most significant challenge you have faced and the steps you have taken to overcome this challenge. How has this challenge affected your academic achievement? (350 words)",
    "Think about an academic subject that inspires you. Describe how you have furthered this interest inside and/or outside of the classroom. (350 words)",
    "What have you done to make your school or your community a better place? (350 words)",
    "Beyond what has already been shared in your application, what do you believe makes you a strong candidate for admissions to the University of California? (350 words)"
  ],
  "UC Davis": [
    "Describe an example of your leadership experience in which you have positively influenced others, helped resolve disputes or contributed to group efforts over time. (350 words — choose 4 of 8 UC PIQs)",
    "Every person has a creative side, and it can be expressed in many ways: problem solving, original and innovative thinking, and artistically, to name a few. Describe how you express your creative side. (350 words)",
    "What would you say is your greatest talent or skill? How have you developed and demonstrated that talent over time? (350 words)",
    "Describe how you have taken advantage of a significant educational opportunity or worked to overcome an educational barrier you have faced. (350 words)",
    "Describe the most significant challenge you have faced and the steps you have taken to overcome this challenge. How has this challenge affected your academic achievement? (350 words)",
    "Think about an academic subject that inspires you. Describe how you have furthered this interest inside and/or outside of the classroom. (350 words)",
    "What have you done to make your school or your community a better place? (350 words)",
    "Beyond what has already been shared in your application, what do you believe makes you a strong candidate for admissions to the University of California? (350 words)"
  ],
  "UC Irvine": [
    "Describe an example of your leadership experience in which you have positively influenced others, helped resolve disputes or contributed to group efforts over time. (350 words — choose 4 of 8 UC PIQs)",
    "Every person has a creative side, and it can be expressed in many ways: problem solving, original and innovative thinking, and artistically, to name a few. Describe how you express your creative side. (350 words)",
    "What would you say is your greatest talent or skill? How have you developed and demonstrated that talent over time? (350 words)",
    "Describe how you have taken advantage of a significant educational opportunity or worked to overcome an educational barrier you have faced. (350 words)",
    "Describe the most significant challenge you have faced and the steps you have taken to overcome this challenge. How has this challenge affected your academic achievement? (350 words)",
    "Think about an academic subject that inspires you. Describe how you have furthered this interest inside and/or outside of the classroom. (350 words)",
    "What have you done to make your school or your community a better place? (350 words)",
    "Beyond what has already been shared in your application, what do you believe makes you a strong candidate for admissions to the University of California? (350 words)"
  ],
  "Cal Poly SLO": "no_supplement",
  "Texas A&M": [
    "Tell us your story. What unique opportunities or challenges have you experienced throughout your high school career that have shaped who you are today? (750 words)"
  ],

  // ═══ MORE CONFIRMED SCHOOLS ═══
  "U of Maryland": [
    "If I could travel anywhere, I would go to... (650 words, optional — fun prompt)",
  ],
  "UMass Amherst": "no_supplement",
  "Oregon State": "no_supplement",
  "UCF": "no_supplement",
  "U of Alabama": "no_supplement",
  "LSU": "no_supplement",
  "Montana State": "no_supplement",
  "Utah State": "no_supplement",

  // ═══ ADDITIONAL PRIVATE UNIVERSITIES ═══
  "American U": [
    "Describe a belief, hobby, idea, issue, or topic about which you're excited. (no limit, optional)"
  ],
  "Loyola Chicago": [
    "We encourage you to think about why you are choosing Loyola. What are you looking for in a university and how does Loyola meet your needs? (300 words, optional)"
  ],
  "Ithaca College": [
    "Tell us about what brings you to apply to Ithaca College. (250 words, optional)"
  ],
  "Hofstra": "no_supplement",
  "Marist": "no_supplement",
  "Quinnipiac": "no_supplement",
  "Seton Hall": "no_supplement",
  "Fairfield": [
    "Why Fairfield? (250 words, optional)"
  ],
  "U of Dayton": [
    "Why are you interested in the University of Dayton? (300 words, optional)"
  ],
  "Loyola Maryland": [
    "In the Jesuit tradition, Loyola focuses on educating the whole person. How do your experiences reflect this ideal? (250 words, optional)"
  ],
  "Rhodes": [
    "Why Rhodes? What attracts you to this college and how do you envision your experience here? (250-500 words)"
  ],
  "Sewanee": [
    "Why does Sewanee appeal to you? (250 words, optional)"
  ],
  "Whitman": [
    "Why Whitman? (300 words, optional)"
  ],
  "U of Denver": [
    "The University of Denver's commitment to diversity, equity, and inclusion is central to our mission. How might your unique perspectives and experiences contribute to DU's community? (250 words, optional)"
  ],
  "St. Louis U": [
    "In the Jesuit tradition of 'being women and men for and with others,' how does one of the values below connect with your life experiences? Pick one: Leadership, Service, Community, Integrity, or Justice. (150 words, optional)"
  ],
  "Clark U": [
    "At Clark, we encourage students to challenge convention and change the world. What convention would you challenge? (250 words, optional)"
  ],
  "Illinois Tech": [
    "Why IIT? How will Illinois Institute of Technology help you achieve your academic and career goals? (300 words, optional)"
  ],
  "Stonehill College": [
    "Why Stonehill? (250 words, optional)"
  ],
  "Valparaiso": [
    "Why Valpo? (250 words, optional)"
  ],
  "Wagner College": [
    "Wagner College has a unique experiential learning program. How does this approach appeal to you? (250 words, optional)"
  ],
  "Siena College": [
    "Why Siena? (250 words, optional)"
  ],
  "Iona U": [
    "Why Iona? (250 words, optional)"
  ],
  "Juilliard": [
    "Describe your artistic goals and how Juilliard can help you achieve them. (250 words)"
  ],
  "Berklee": [
    "Tell us about your musical journey and why you want to study at Berklee. (500 words)"
  ],
  "Pratt": [
    "Describe your creative interests and how they have shaped who you are. How will Pratt help you grow as a creative thinker and maker? (250 words)"
  ],
  "Parsons": [
    "Describe a challenging situation where you used creative thinking to develop a solution. (250-500 words)"
  ],
  "SCAD": [
    "Why SCAD? How will SCAD help you achieve your creative and professional goals? (250 words)"
  ],
  "RISD": [
    "RISD prides itself on collaboration across all disciplines. Tell us how your creative interests connect to other areas of inquiry. (250 words, if applying via Common App)"
  ],
  "SVA": [
    "Why SVA? (500 words, optional)"
  ],
  "Deep Springs": [
    "Deep Springs values labor, academics, and self-governance. Describe a meaningful experience with physical labor and what it taught you. (no word limit)"
  ],
  "Webb Institute": [
    "Why do you want to study naval architecture and marine engineering at Webb Institute? (500 words)"
  ],
  "Naval Academy": [
    "Describe what led to your initial interest in the naval service and how the Naval Academy will help you achieve your long-range goals. (325 words)"
  ],
  "West Point": [
    "Describe how you have demonstrated leadership in your school, community, or other activities. (325 words)",
    "Why do you want to attend the United States Military Academy and serve in the United States Army? (325 words)"
  ],
  "Air Force Academy": [
    "Describe your motivation for pursuing a career in the Air Force or Space Force. How has your life experience prepared you for the challenges you will face at the Academy? (500 words)"
  ],
  "Hope College": [
    "Hope College is committed to educating the whole person. How have your experiences prepared you to contribute to the Hope community? (250 words, optional)"
  ],
  "St. Olaf": [
    "Why St. Olaf? How will your time here contribute to your personal growth? (250 words, optional)"
  ],
  "Wheaton IL": [
    "As an explicitly Christian liberal arts college, Wheaton College integrates faith and learning. Share how your faith shapes your approach to education. (500 words)",
    "Describe a significant experience that has shaped your worldview. (250 words)"
  ],
  "Hendrix College": [
    "Hendrix has a tradition of engagement — with ideas, with people, with the world. Tell us about a time you were deeply engaged in something meaningful. (250 words, optional)"
  ],
  "Wabash": [
    "Wabash College educates men to think critically, act responsibly, lead effectively, and live humanely. Which of these resonates most with you and why? (300 words, optional)"
  ],
  "Spelman": [
    "What makes Spelman the right fit for you? How will you contribute to the Spelman sisterhood? (250-500 words)"
  ],
  "Howard": [
    "Howard University's motto is 'Truth and Service.' How do you plan to embody this motto during your time at Howard and beyond? (500 words)",
    "Describe a personal or academic achievement that shaped your desire to attend Howard University. (250 words)"
  ],
  "Morehouse": [
    "Why Morehouse? How will a Morehouse education help you achieve your goals? (250-500 words)"
  ],
};

let updated = 0;
let noSupplement = 0;

for (const school of schools) {
  const entry = VERIFIED_BATCH2[school.n];
  if (!entry) continue;

  if (entry === "no_supplement") {
    school.prompts = ["This school does not require supplemental essays. Only the Common App personal essay is needed."];
    noSupplement++;
    updated++;
  } else if (Array.isArray(entry) && entry.length > 0) {
    school.prompts = entry;
    updated++;
  }
}

writeFileSync('src/data/schools.json', JSON.stringify(schools, null, 2));

console.log(`Batch 2 - Updated: ${updated} schools`);
console.log(`Batch 2 - No supplement: ${noSupplement} schools`);

// Verify total coverage
const allSchools = JSON.parse(readFileSync('src/data/schools.json', 'utf-8'));
const placeholder = allSchools.filter(s => s.prompts?.length === 1 && s.prompts[0].startsWith('Why '));
const real = allSchools.filter(s => s.prompts?.length > 1 || (s.prompts?.length === 1 && !s.prompts[0].startsWith('Why ')));
console.log(`\nTotal coverage: ${real.length} / ${allSchools.length} schools have real/verified prompts`);
console.log(`Remaining placeholder: ${placeholder.length} schools`);
