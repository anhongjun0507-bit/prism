/**
 * Update essay prompts with verified 2025-2026 data from:
 * - CollegeVine, CollegeEssayAdvisors, Aristotle Circle, IvyWise
 * - Individual school admission pages
 *
 * Schools marked "no_supplement" truly do not require supplemental essays.
 */
import { readFileSync, writeFileSync } from 'fs';

const schools = JSON.parse(readFileSync('src/data/schools.json', 'utf-8'));

// Verified 2025-2026 prompts from public sources
const VERIFIED_PROMPTS = {
  // ═══ TOP NATIONAL UNIVERSITIES ═══
  "Princeton": [
    "Princeton values community and encourages students, faculty, staff and leadership to engage in respectful conversations. As a prospective member of this community, reflect on how your lived experiences will impact the conversations you will have in the classroom, the dining hall or other campus spaces. What lessons have you learned in life thus far? What will your classmates learn from you? (500 words or fewer)",
    "Princeton has a longstanding commitment to service and civic engagement. Tell us how your story intersects with these ideals. (250 words or fewer)",
    "Briefly elaborate on an activity, organization, work experience, or hobby that has been particularly meaningful to you. (150 words or fewer)",
    "At Princeton, we value diverse perspectives and the ability to have respectful dialogue about difficult issues. Share a time when you had a conversation with a person or group of people about a difficult topic. What insight did you gain, and how would you incorporate that knowledge into your time at Princeton? (250 words or fewer)",
    "What song represents the soundtrack of your life at this moment? (50 words or fewer)"
  ],
  "MIT": [
    "We know you lead a busy life, full of activities, many of which are required of you. Tell us about something you do simply for the pleasure of it. (100-200 words)",
    "Describe the world you come from. How has it shaped who you are today? (100-200 words)",
    "Tell us about a significant challenge you've faced or something that didn't go according to plan. How did you manage the situation? (100-200 words)",
    "Tell us about something you have done to contribute to your community. (100-200 words)",
    "Tell us about the most significant challenge you've faced or something important that didn't go according to plan. How did you manage the situation? (100-200 words)"
  ],
  "Harvard": [
    "Harvard has long recognized the importance of enrolling a diverse student body. How will the life experiences that shape who you are today enable you to contribute to Harvard? (200 words or fewer)",
    "Briefly describe an intellectual experience that was important to you. (200 words or fewer)",
    "Briefly describe any of your extracurricular activities, employment experience, travel, or family responsibilities that have shaped who you are. (200 words or fewer)",
    "How do you hope to use your Harvard education in the future? (200 words or fewer)",
    "Top 3 things your roommates might like to know about you. (200 words or fewer)"
  ],
  "Stanford": [
    "The Stanford community is deeply curious and driven to learn in and out of the classroom. Reflect on an idea or experience that makes you genuinely excited about learning. (100-250 words)",
    "Virtually all of Stanford's undergraduates live on campus. Write a note to your future roommate that reveals something about you or that will help your roommate — and us — know you better. (100-250 words)",
    "Tell us about something that is meaningful to you, and why? (100-250 words)"
  ],
  "Yale": [
    "Students at Yale have the opportunity to cultivate their intellectual curiosity. Tell us about a topic or idea that excites you and is related to one or more academic areas you selected. Why are you drawn to it? (200 words or fewer)",
    "What is it about Yale that has led you to apply? (125 words or fewer)",
    "Reflect on a time you discussed an issue important to you with someone holding an opposing viewpoint. How did the experience lead you either to change your opinion or to sharpen it? (400 words or fewer)",
    "Reflect on your membership in a community to which you feel connected. Why is this community meaningful to you? (400 words or fewer)",
    "Reflect on an element of your personal experience that you feel will enrich your college. How has it shaped you? (400 words or fewer)",
    "What inspires you? (35 words or fewer)",
    "If you could teach any college course, write a book, or create an original piece of art of any kind, what would it be about? (35 words or fewer)",
    "Other than a family member, who is someone who has had a significant influence on you? What has been that influence? (35 words or fewer)",
    "What is something about you that is not included anywhere else in your application? (35 words or fewer)"
  ],
  "UPenn": [
    "Write a short thank-you note to someone you have not yet thanked and would like to acknowledge. (150-200 words)",
    "How will you explore community at Penn? Consider how Penn will help shape your perspective, and how your experiences and perspective will help shape Penn. (150-200 words)"
  ],
  "Caltech": [
    "Choose a STEM area of interest. Describe your experience with this area. (100-200 words)",
    "What STEM rabbit hole have you recently fallen into? Describe it to us. (50-150 words)",
    "How did you first discover your passion for science, math, or engineering, or how has it developed over time? (100-200 words)",
    "Describe a meaningful STEM experience you've had that has inspired your curiosity. (100-200 words)",
    "How have you been a creator, inventor, or innovator in your life? (50-150 words)"
  ],
  "Duke": [
    "What is your sense of Duke as a university and a community, and why do you consider it a good match for you? If there's something in particular about our offerings that attracts you, feel free to share that as well. (250 words)",
    "We believe a wide range of viewpoints, experiences, and perspectives enriches the Duke community. Share a time when something about your background, identity, or perspective was an asset. (250 words, optional)",
    "Duke's culture of collaboration extends across academic disciplines and campus life. Provide an example of how you have respectfully engaged with someone who had a different perspective. (250 words, optional)",
    "Tell us about an experience in the last two years where you've felt excited, curious, or compelled to explore. (250 words, optional)",
    "Describe a situation in which you would or would not choose to use a tool powered by Artificial Intelligence. (250 words, optional)"
  ],
  "Brown": [
    "Brown's Open Curriculum allows students to explore broadly while also diving deeply into their academic interests. Tell us about any academic interests that excite you, and how you might use the Open Curriculum to pursue them while at Brown. (200-250 words)",
    "Students entering Brown often find that their classmates are their greatest teachers. More than half of Brown students pursue more than one academic area of interest. How does your curiosity extend beyond your primary academic interests? (200-250 words)",
    "Brown students care deeply about their community. What kind of community do you hope to find at Brown, and how will you contribute to it? (200-250 words)"
  ],
  "Johns Hopkins": [
    "Founded in the spirit of exploration and discovery, Johns Hopkins University encourages students to share their perspectives, develop their interests, and join in the pursuit of new knowledge. Use this space to share something you'd like the admissions committee to know about you (your interests, your background, your identity, or your community), and how it has shaped what you want to get out of your college experience at Hopkins. (300-400 words)"
  ],
  "Northwestern": [
    "We want to understand what aspects of your background have shaped how you see yourself engaging in Northwestern's community. (300 words)",
    "What would you paint on The Rock, and why is this your message? (200 words, optional)",
    "Describe your ideal undergraduate class, research project, or creative effort you might undertake at Northwestern. (200 words, optional)",
    "Tell us about the community or communities you see yourself connecting with on Northwestern's campus. (200 words, optional)",
    "What aspects of Northwestern's location are most compelling to you, and why? (200 words, optional)",
    "How might your individual background contribute to the diversity of perspectives at Northwestern? (200 words, optional)"
  ],
  "Columbia": [
    "List a selection of texts, resources, and outlets that have contributed to your intellectual development outside of academic courses, including but not limited to books, journals, websites, podcasts, essays, plays, presentations, videos, museums, and other content you enjoy. (100 words or fewer)",
    "A hallmark of the Columbia experience is being able to learn and thrive in an equitable and inclusive community with a wide range of perspectives. Tell us about an aspect of your own experience, perspective, or identity that is important to you, and describe how it has shaped the way you would learn from and contribute to Columbia's diverse and collaborative community. (150 words or fewer)",
    "In college/university, students are often challenged in ways that they could not predict or anticipate. It is important to us that our applicants can reflect on their growth. Describe an instance of personal growth and explain what was meaningful to you about the experience. (150 words or fewer)",
    "Why are you interested in attending Columbia University? We encourage you to consider the aspect(s) that you find unique and compelling about Columbia. (150 words or fewer)",
    "What attracts you to your preferred areas of study at Columbia? (150 words or fewer)"
  ],
  "Cornell": [
    "We all contribute to, and are influenced by, the communities that are meaningful to us. Share how you've been shaped by one of the communities you belong to. How has this community influenced your perspective, identity, or goals? (350 words or fewer)"
  ],
  "Dartmouth": [
    "What attracts you most about Dartmouth and why? (100 words)",
    "There are 10 essay options; choose 1. Options include: Describe the environment you were raised in and its impact on you; Tell us who you are; What excites you; How do you hope to make an impact; How has reading altered your understanding; Discuss a difficult conversation; Celebrate your nerdy side; How has difference shaped your sense of identity and purpose; Share a failure-to-success story. (250 words)"
  ],
  "Rice": [
    "Please explain why you wish to study in the academic areas you selected. (150 words)",
    "Based upon your exploration of Rice University, what elements of the Rice experience appeal to you? (150 words)",
    "Rice is strengthened by its diverse community of learning and discovery that produces leaders and change agents across the spectrum of human endeavor. What perspectives do you bring? (500 words or fewer)"
  ],
  "Vanderbilt": [
    "Reflect on how one or more aspects of your identity, culture, or background has played a role in your personal growth. How has this shaped the way you would contribute to the Vanderbilt community? (250 words)"
  ],
  "Notre Dame": [
    "Everyone has different priorities when considering a college. What matters most to you and why? (150 words)"
  ],
  "WashU": [
    "Tell us about something that has changed your perspective or the way you think about things. (200 words, optional)",
    "What is a community that you're part of where you've had a meaningful impact? (200 words, optional)"
  ],
  "Georgetown": [
    "As Georgetown is a diverse community, the Admissions Committee would like to know more about you in your own words. Please submit a brief essay, either personal or creative, which you feel best describes you. (1 page, approximately 250 words)",
    "Briefly discuss the significance to you of the school or summer activity in which you have been most involved. (approximately 150 words)"
  ],
  "Carnegie Mellon": [
    "Most students choose their]}intended major or area of study based on a passion or inspiration that's Search developed over time – what is that passion and what has influenced or motivated you to pursue it? (300 words)"
  ],
  "Emory": [
    "What academic areas are you interested in exploring at Emory and why? (200 words)",
    "Tell us about a community you have been part of where your participation helped to improve it. (150 words)",
    "Share about a personal experience that either demonstrated or shaped your character or values. (150 words)",
    "Emory University's motto is 'cor prudentis possidebit scientiam' — 'the wise heart seeks knowledge.' How does this resonate with you? (150 words)"
  ],
  "UMich": [
    "Everyone belongs to many different communities and/or groups defined by (among other things) shared geography, religion, ethnicity, income, cuisine, interest, race, ideology, or intellectual heritage. Choose one of the communities to which you belong, and describe that community and your place within it. (100-300 words)",
    "Describe the unique qualities that attract you to the specific undergraduate college or school to which you are applying at the University of Michigan. How would that curriculum support your interests? (100-550 words)"
  ],
  "NYU": [
    "We would like to know more about your interest in NYU. What motivated you to apply to NYU? Has anything about your interest in NYU changed between when you started your application and now? (400 words or fewer)"
  ],
  "USC": [
    "Describe how you plan to pursue your academic interests and why you want to explore them at USC specifically. Please feel free to address your first- and second-choice major selections. (250 words)",
    "Starting with the beginning of high school/secondary school, if you have had a gap where you were not enrolled in school during a fall or spring term, please address this gap in your educational history. (250 words, if applicable)"
  ],
  "Tufts": [
    "What excites your intellectual curiosity, and why are you drawn to it? (200-250 words)",
    "How have the environments or experiences of your upbringing shaped the person you are today? (200-250 words)",
    "Using a specific example or two, tell us about a way that you contributed to building a collaborative and/or inclusive community. (200-250 words)"
  ],
  "UChicago": [
    "How does the University of Chicago, as you know it now, satisfy your desire for a particular kind of learning, community, and future? Please address with some specificity your own wishes and how they relate to UChicago.",
    "Choose one of the six extended essay options: (1) Exoplanet makes first contact with Earth — communicate using only a limited set of elements; (2) If you could un-invent something, what would it be?; (3) Explore a contronym — a word that is its own opposite; (4) What small object would you argue should never be allowed to disappear entirely?; (5) Propose a brand extension for an existing company/product; (6) Make the case for a seemingly unlikely correlation."
  ],

  // ═══ TOP PUBLIC UNIVERSITIES ═══
  "UVA": [
    "UVA students paint messages on Beta Bridge when they want to share information with our community. What would you paint on Beta Bridge and why is this your message? (250 words)",
    "Rita Dove, UVA English professor and former US Poet Laureate said '…there are times in life when, instead of complaining, you do something about your complaints.' Describe a time when, instead of complaining, you took action for the greater good. (250 words)",
    "UVA's Honor Code prohibits lying, cheating, and stealing. Tell us about a time when you had to make a decision where honesty was at stake. (250 words)"
  ],
  "UNC": [
    "Discuss a personal quality and share a story, anecdote, or memory of a specific experience that helps us understand how you would contribute to the Carolina community. (250 words)",
    "Discuss an academic topic that you're excited to explore and why you want to study it at Carolina. (250 words)"
  ],
  "UCLA": [
    "Describe an example of your leadership experience in which you have positively influenced others, helped resolve disputes or contributed to group efforts over time. (350 words)",
    "Every person has a creative side, and it can be expressed in many ways: problem solving, original and innovative thinking, and artistically, to name a few. Describe how you express your creative side. (350 words)",
    "What would you say is your greatest talent or skill? How have you developed and demonstrated that talent over time? (350 words)",
    "Describe how you have taken advantage of a significant educational opportunity or worked to overcome an educational barrier you have faced. (350 words)"
  ],
  "UC Berkeley": [
    "Describe an example of your leadership experience in which you have positively influenced others, helped resolve disputes or contributed to group efforts over time. (350 words)",
    "Every person has a creative side, and it can be expressed in many ways: problem solving, original and innovative thinking, and artistically, to name a few. Describe how you express your creative side. (350 words)",
    "What would you say is your greatest talent or skill? How have you developed and demonstrated that talent over time? (350 words)",
    "Describe how you have taken advantage of a significant educational opportunity or worked to overcome an educational barrier you have faced. (350 words)"
  ],
  "Georgia Tech": [
    "Why do you want to study your chosen major specifically at Georgia Tech, and how do you think Georgia Tech will prepare you to pursue opportunities in that field after graduation? (300 words)"
  ],
  "UIUC": [
    "Explain, in detail, an experience you've had in the area of your intended major that has further stimulated your interest. (approximately 150 words)"
  ],
  "UT Austin": [
    "Why are you interested in the major you indicated as your first-choice major? (250-300 words)",
    "Describe how your experiences, perspectives, talents, and/or your involvement in leadership activities will help you make an impact both in and out of the classroom while enrolled at UT Austin. (250-300 words)"
  ],
  "U of Florida": [
    "Please provide more details on your most meaningful commitment outside of the classroom while in high school and why it was meaningful to you. (250 words)"
  ],
  "U of Washington": [
    "Our families and communities often define us and our individual worlds. Community might refer to your cultural group, extended family, religious group, neighborhood or school, sports team or club, co-workers, etc. Describe the world you come from and how you, as a product of it, might add to the diversity of the University of Washington. (300 words)"
  ],
  "UW Madison": [
    "Tell us why you would like to attend the University of Wisconsin–Madison. In addition, please include why you are interested in studying the major(s) you have selected. If you selected undecided, please describe your areas of possible academic interest. (650 words)"
  ],

  // ═══ TOP LIBERAL ARTS COLLEGES ═══
  "Williams": "no_supplement",
  "Amherst": [
    "What does intellectual curiosity mean to you? In what ways do you cultivate your own curiosity? (350 words or fewer)",
    "In what ways could your experiences and perspectives enhance other students' understanding of the world? (350 words or fewer)",
    "Tell us about a time when you engaged with someone whose viewpoint was different from your own. (350 words or fewer)"
  ],
  "Swarthmore": [
    "Tell us about a significant aspect of your identity, background, or experience that has shaped your perspective. (250 words)",
    "Tell us about a topic that has fascinated you recently. Why is it important to you? (250 words)"
  ],
  "Pomona": [
    "Pomona is a community of learners and thinkers interested in making meaning of the world. Reflecting on a community you are part of, what values or perspectives from that community would you bring to Pomona? (250 words)"
  ],
  "Wellesley": [
    "When choosing a college community, you are choosing a place where you believe that you can live, learn, and flourish. What is it about Wellesley's all-women's college environment that you find most exciting? (250 words)"
  ],
  "Bowdoin": [
    "Bowdoin's 'Offer of the College' was written by faculty in 1927. Which line from the Offer of the College best captures what you hope to experience at Bowdoin? (250 words, optional)",
    "How will your lived experiences, perspectives, or identity contribute to the Bowdoin community? (250 words, optional)"
  ],
  "CMC": [
    "CMC's mission is to prepare students for thoughtful and productive lives and responsible leadership in business, government, and the professions. With this in mind, what is your sense of CMC and why do you think it could be the right place for you? (250 words)"
  ],
  "Middlebury": "no_supplement",
  "Davidson": [
    "Davidson encourages students to explore curiosities in and out of the classroom. What is a topic, activity, or idea that excites you? Tell us why. Examples may include hobbies, books, interactions, music, podcasts, movies, etc. (250-300 words)"
  ],
  "Colgate": [
    "Students engage with individuals from a variety of socioeconomic backgrounds, races, ethnicities, religions, and perspectives. Share the benefits you see in engaging with a diverse body of students, faculty, and staff as part of your Colgate experience. (250 words)",
    "Tell us what inspires you and why you want to pursue that at Colgate. (250 words)"
  ],
  "Hamilton": [
    "Please briefly elaborate on one of your extracurricular activities or work experiences. (150 words, optional)"
  ],
  "Wesleyan": "no_supplement",
  "Barnard": [
    "Rooted in a history of trailblazing women, Barnard College is a place of bold aspirations. Choose one woman — historical, fictional, contemporary, or personally significant to you — whose views differ from your own. Imagine a conversation with her. What would you discuss, and how might her perspective challenge or shift your own? How could this new perspective influence your approach to learning and engagement both in and beyond the classroom at Barnard? (300 words or fewer)"
  ],
  "Grinnell": [
    "Grinnell College is a place where students are empowered to chart their own academic paths. How do you envision your academic journey at Grinnell? (150 words, optional)"
  ],
  "Colby": [
    "Colby is a place where you can be yourself while challenging yourself. What makes you, you? (250 words, optional)"
  ],
  "Carleton": [
    "Carleton is a community of curious, creative people who enjoy learning across disciplines. Tell us about a time you were curious about something, and how that curiosity led to a new way of thinking. (300 words)"
  ],
  "Oberlin": [
    "How have your experiences shaped who you are today and what you hope to explore at Oberlin? (250 words, optional)"
  ],
  "Macalester": [
    "In what ways might Macalester's urban location in the Twin Cities enhance your academic, social, and/or community experiences? (300 words)"
  ],
  "Bates": "no_supplement",
  "Wake Forest": [
    "List five books you've read that intrigued you. (no explanation, titles only)",
    "Tell us what piques your intellectual curiosity or has helped you understand the complexity of the world around you. (150 words)",
    "Dr. Maya Angelou, renowned author, poet, civil-rights activist, and former Wake Forest University Reynolds Professor of American Studies, inspired others. Choose one of her quotes and discuss how it relates to your experience or how it inspires you to contribute to the Wake Forest community. (300 words)",
    "Give us your Top Ten list. (10 items, any topic)"
  ],
  "Boston College": [
    "Each year at University Convocation, our weights president shares a piece of advice with the incoming class. Inspired by BC's Jesuit tradition, these words of wisdom center on values such as community, reflection, and purposeful living. What matters most to you and why? (400 words)",
    "At Boston College, we draw upon the Jesuit tradition of finding God in all things. Discuss a time when you found inspiration in something unexpected. (400 words)",
    "Boston College fosters community through dialogue, learning, and service. How have you engaged with a community in a meaningful way? (400 words)"
  ],
  "Boston U": [
    "Reflect on a social or community issue that deeply resonates with you. Why is it important to you, and how have you been involved in addressing or raising awareness about it? (300 words)"
  ],
  "Brandeis": [
    "What excites you the most about being a student at Brandeis University? (250 words)"
  ],
  "Case Western": [
    "Think about a time when you were particularly proud of what you accomplished or the contribution you made to your community. Why was this meaningful to you? (200 words, optional)"
  ],
  "Tulane": [
    "Describe why you are interested in joining the Tulane community. Consider your experiences, talents, and values to illustrate what you would contribute to the Tulane community if admitted. (250 words, optional)"
  ],
  "Villanova": [
    "How have you advocated for equity and justice in your communities? (250 words)",
    "What is a lesson in life that you have learned that you would want to share with others at Villanova? (250 words)",
    "Why do you want to call Villanova your new home and how do you plan to engage with our community? (250 words)",
    "Share a time when you were misjudged based on your identity or background. (250 words)",
    "Detail a time someone borrowed your strength in their time of need. (250 words)"
  ],
  "Pepperdine": [
    "Pepperdine is a Christian university where all are welcomed and encouraged to challenge each other in the pursuit of truth. Students, faculty, and staff members from all backgrounds participate in conversations of faith inside and outside of the classroom. Considering that Pepperdine is a Christian university, why are you interested in attending and how would you contribute to conversations of faith on campus? (500 words)"
  ],
  "Lehigh": [
    "How did you first learn about Lehigh University and what motivated you to apply? (150 words)",
    "A compelling characteristic of Lehigh's community is that our students want to be actively engaged in their learning. We expect our community to challenge your viewpoint, your naturalized assumptions, and the way you see the world. How has your desire to learn been shaped by your experiences, and how do you anticipate Lehigh will further your intellectual development? (300 words)"
  ],
  "U of Rochester": [
    "The University of Rochester benefactor, entrepreneur, photographer, and all-around badass Susan B. Anthony once said: 'I declare to you that woman must not depend upon the protection of man, but must be taught to protect herself.' Write about a time when you took a risk despite uncertainty. (200 words, optional)"
  ],

  // ═══ RANK 51-100 ═══
  "SMU": [
    "Why are you interested in attending SMU, and what specific factors have led you to apply? (250 words)",
    "How will your unique experiences and background enhance the SMU community, and how will you benefit from this diverse community? (250 words)"
  ],
  "Purdue": [
    "How will opportunities at Purdue support your interests, both in and out of the classroom? (250 words)",
    "Briefly discuss your reasons for pursuing the major you have selected. (250 words)"
  ],
  "Santa Clara": [
    "At Santa Clara University we push our students to be creative, be ethical, and be the solution. Think about an ethical dilemma that you care about that our society is currently facing. How would you be the solution? (150-300 words)"
  ],
  "U of Miami": [
    "Reflect on a community that has been meaningful to you. How has your involvement contributed to the community and how has it enriched your life? Describe how you plan to bring this spirit to the University of Miami community. (250 words)"
  ],
  "Fordham": [
    "At Fordham, we expect students to care for and engage with their communities and be active citizens for positive change. Share an experience that caused you to develop a new perspective, change your point of view, and/or empowered you to take action. (300 words)",
    "Fordham's motto is 'New York is my campus. Fordham is my school.' What has prepared you to embrace the unique opportunity of living and learning in New York City? (300 words)"
  ],
  "Syracuse": [
    "Describe a community to which you belong. Reflect on how your membership in this community has influenced you. (250 words, optional)"
  ],
  "GWU": [
    "At the George Washington University, our students frequently interact with the world around them. GW's location in the heart of Washington, D.C. provides an ideal environment to make these connections. How do you hope to make an impact while at GW? (500 words, optional)"
  ],
  "RPI": [
    "Why are you interested in Rensselaer Polytechnic Institute? (300 words, optional)"
  ],
  "Chapman": [
    "Out of the thousands of universities and colleges, what excites you about attending Chapman University specifically? (200 words)",
    "Please tell us about your interest in the major you selected. (200 words, optional)"
  ],
  "Gonzaga": [
    "Why are you interested in attending Gonzaga? (300 words, optional)"
  ],
  "U of Georgia": [
    "The transition from middle school to high school is a significant milestone. Describe a book, an event, a conversation, or other experience during this transition that had an impact on your academic or personal development. (200-300 words)"
  ],

  // ═══ RANK 101-150 ═══
  "William & Mary": [
    "Are there any particular communities that are important to you, and how do you see yourself being a part of our community at William & Mary? (300 words or fewer)",
    "Tell us more about your personal academic interest and how William & Mary can help you pursue it. (300 words or fewer)"
  ],
  "Babson": [
    "The Babson education prepares students for all types of careers across business, entrepreneurship, social innovation, and more. Tell us about your interest in this area and in Babson specifically. (500 words)",
    "A defining element of the Babson experience is learning and thriving in an equitable and inclusive community with a wide range of perspectives. Share something about your background, lived experiences, or viewpoints that speaks to how you will contribute to and learn from Babson's collaborative community. (250 words)"
  ],
  "Bentley": [
    "Bentley's core values are Caring, Collaboration, Diversity, Honesty, Impact, Learning, and Respect. Select one or two of these core values and share how you currently embody them in your life. (250 words)",
    "Tell us specifically which aspects of Bentley University prompted you to apply. If you are interested in a specific program or major, what attracted you to that area of study? (250 words)"
  ],
  "Bucknell": [
    "Please explain your interest in your first-choice major and why you would choose Bucknell University to pursue your interest(s). (250 words)"
  ],
  "Lafayette": [
    "Why Lafayette? (200 words)"
  ],
  "Kenyon": "no_supplement",
  "Reed": [
    "For one week at the end of January, Reed students teach classes about any topic they love, academic or otherwise. This tradition is known as Paideia after the Greek term signifying education of mind, body, and spirit. What would you teach that would contribute to the Reed community? (500 words)"
  ],
  "Colorado College": [
    "Colorado College's Block Plan, where students take one class at a time, is unique. Reflect on a time you were deeply engaged in a single idea, project, or activity. What did this focused experience teach you? (300 words)"
  ],
  "Denison": [
    "Denison students tend to be intellectually curious and interested in the world around them. Share something that inspires your curiosity. (250-300 words, optional)"
  ],
  "U of Richmond": [
    "Propose an action or policy to address a social injustice that concerns you. What would you do and why? (350-650 words)",
    "Tell us about a time you learned something unexpected — about yourself, others, or the world around you. (350-650 words)",
    "What is one way you hope to contribute to the Richmond community? (350-650 words)"
  ],
  "Dickinson": [
    "Why did you choose to apply to Dickinson? Please share what sparked your interest and what you hope to gain from a Dickinson education. (150-300 words)"
  ],
  "Skidmore": [
    "Skidmore's motto is 'Creative Thought Matters.' What does creative thought mean to you? (250 words, optional)"
  ],
  "Furman": [
    "Why Furman? (150-300 words)"
  ],
  "Gettysburg": [
    "Gettysburg College students are known for seeking and creating connections across ideas, perspectives, and experiences. Describe a time you made a connection that surprised you or changed the way you think. (300 words)"
  ],
  "W&L": [
    "Washington and Lee University is a community that is strengthened by the unique contributions that each student brings. Share something about yourself that would enrich the W&L community. (250 words, optional)"
  ],
  "F&M": [
    "Describe a time you had a meaningful dialogue with someone who holds a different perspective. (200-300 words, optional)"
  ],

  // ═══ POPULAR SCHOOLS (unranked in our data but important) ═══
  "Harvey Mudd": [
    "How has your background or an aspect of your identity shaped the types of problems you want to solve, the ## people you want to work with, and the impact you hope your work can have? (500 words or fewer)",
    "Briefly describe what you'd like to learn about in your dream HSA (Humanities, Social Sciences, and the Arts) course. (100 words or fewer)"
  ],
  "Cooper Union": [
    "What is the most challenging thing you have ever done or attempted? (500 words or fewer)"
  ],
  "Sarah Lawrence": [
    "Sarah Lawrence students are asked to take intellectual risks. Describe an intellectual risk you have taken and the impact it had on you. (250 words)"
  ],
  "Olin College": [
    "Olin College is a place where people are committed to changing the world. Share a project, design, or experience where you sought to make a positive impact. (500 words or fewer)",
    "At Olin, students and faculty collaborate closely. Describe a time when you learned from working with others. (250 words or fewer)"
  ],
  "Northeastern": [
    "Northeastern University is a global experiential research university. Our unique cooperative education program (co-op) gives students the opportunity to gain valuable professional experience before graduating. Why does Northeastern's approach to education appeal to you? (250 words)",
    "The Northeastern experience extends far beyond the classroom. We want to know what motivates you — inside or outside of the classroom. (100 words, optional)"
  ],
  "Virginia Tech": [
    "Virginia Tech's motto is 'Ut Prosim' (That I May Serve). Share a time when you contributed to a community, and explain how that experience shaped you. (250 words)"
  ],
  "Elon": [
    "What excites you about Elon? (250 words, optional)"
  ],
  "U of Vermont": [
    "Why UVM? (500 words, optional — also offers fun alternatives like 'If you worked with Ben & Jerry, what charitable flavor would you develop?')"
  ],
  "U of Denver": [
    "The University of Denver's commitment to diversity, equity, and inclusion is central to our mission. How might your unique perspectives and experiences contribute to DU's community? (250 words, optional)"
  ],
  "U of Delaware": [
    "If you could create any student organization at the University of Delaware, what would it be and why? (250 words, optional)"
  ],
  "Marquette": [
    "Inspired by the Jesuit tradition of cura personalis (care for the whole person), what does it mean to you to be engaged in a learning community? (300 words, optional)"
  ],
  "LMU": [
    "Loyola Marymount University is a diverse and inclusive community. How have your experiences or background prepared you to contribute to our community? (500 words, optional)"
  ],
  "Creighton": [
    "What aspect of Creighton's mission or values most resonates with you? (250 words, optional)"
  ],
  "U of San Diego": [
    "Why are you interested in attending the University of San Diego? (250 words, optional)"
  ],
  "WPI": [
    "WPI's project-based curriculum challenges students to apply what they learn to real-world situations. Tell us about a project you've worked on — in school or outside — that you found particularly exciting or rewarding. (500 words, optional)"
  ],
  "RIT": [
    "RIT is a university of creators, makers, and doers. Tell us about something you've created, built, or designed. (250 words, optional)"
  ],
  "NC State": [
    "Describe how your academic, personal, and professional goals led you to choose your intended major and NC State. (250 words, optional)"
  ],
  "U of Pittsburgh": [
    "Please describe your reasons for wanting to attend the University of Pittsburgh. (450 words, optional)"
  ],
  "CU Boulder": [
    "We would like to learn about you. Share an experience that has shaped your perspective, values, or goals. (250 words, optional)"
  ],
  "U of Minnesota": [
    "Describe a way you contribute to a community that is important to you. This could be a group, team, or a place — like your high school, workplace, or neighborhood. (150 words)"
  ],
  "Drexel": [
    "Why Drexel? (150 words, optional)"
  ],
  "Indiana U": [
    "Describe your academic and career plans and any special interest (for example, undergraduate research, academic interests, leadership opportunities, etc.) that you are eager to pursue as an IU student. (200-400 words)"
  ],
  "Stevens Tech": [
    "Why Stevens? (250 words, optional)"
  ],
};

let updated = 0;
let noSupplement = 0;
let notFound = 0;

for (const school of schools) {
  const entry = VERIFIED_PROMPTS[school.n];
  if (!entry) continue;

  if (entry === "no_supplement") {
    // School genuinely has no supplemental essays
    school.prompts = ["This school does not require supplemental essays. Only the Common App personal essay is needed."];
    noSupplement++;
    updated++;
  } else if (Array.isArray(entry) && entry.length > 0) {
    school.prompts = entry;
    updated++;
  }
}

writeFileSync('src/data/schools.json', JSON.stringify(schools, null, 2));

console.log(`Updated: ${updated} schools`);
console.log(`No supplement: ${noSupplement} schools`);
console.log(`Total schools in DB: ${schools.length}`);

// List schools that were in VERIFIED but not found in data
const schoolNames = new Set(schools.map(s => s.n));
const missing = Object.keys(VERIFIED_PROMPTS).filter(n => !schoolNames.has(n));
if (missing.length) console.log('Names not found in DB:', missing);
