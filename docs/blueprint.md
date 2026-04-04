# **App Name**: PRISM

## Core Features:

- User Authentication & Login: Secure user authentication using Firebase Auth, including Google Sign-In, to protect user data and provide easy access to the application. The Welcome/Login page features a dark background and a floating logo animation.
- User Onboarding & Profile Setup: A guided onboarding process for new users to input essential information like name, dream school, major, and grade. Grade selection is presented with intuitive pill buttons. This data is saved to Firebase Firestore for personalized experiences.
- Personalized Dashboard: A home screen displaying a D-day counter for application deadlines, customizable statistics cards, and a list of target universities. Features a prominent dark hero card with a gradient background for visual appeal.
- University Admission Analysis: Allows users to input their academic specifications (GPA, SAT, TOEFL, AP courses) into a form. An AI tool then performs a probability analysis to predict admission chances for US universities based on the provided data.
- Essay Management & Editor: Provides access to school-specific essay prompts and an integrated text editor for drafting and refining essays. Includes a word count feature and allows users to save their compositions, which are stored in Firebase Firestore.
- AI Admissions Counseling Chat: An interactive chat interface where users can receive admissions counseling. The AI acts as a tool to answer questions, provide guidance, and offer personalized advice regarding US university applications.
- Application Planner & Milestones: A timeline-based planner to help users track and manage critical milestones throughout the US university application journey. Each milestone can be marked as complete, with progress saved to Firebase Firestore.
- Multi-Language UI (Korean): All user interface text within the application is presented in Korean, specifically catering to Korean international school students.
- Persistent Data Storage: Utilizes Firebase Firestore for robust and scalable data persistence across all application features, ensuring user profiles, application data, essays, and planner details are securely stored and retrieved.
- Intuitive Navigation: Features a user-friendly bottom tab navigation bar for quick and easy access to the main sections of the app: Home, Schools, Essays, AI Chat, and Planner.

## Style Guidelines:

- Body text font: 'Plus Jakarta Sans' for a modern, clean, and highly legible aesthetic.
- Heading text font: 'Fraunces' for distinctive, sophisticated, and impactful titles that convey gravitas.
- Primary color: A deep burnt orange (#9a3c12) for branding, accents, and key interactive elements.
- Background color: A warm off-white (#f5f3f0) to provide a calm, inviting, and spacious canvas for content.
- Card backgrounds: Pure white (#FFFFFF) for content cards, ensuring high contrast and readability against the off-white background.
- Dark hero sections: Use a rich gradient from #1a1714 to #2c2620, especially for prominent sections like the Dashboard hero card and Welcome/Login page.
- Cards: Designed with an 18px border-radius and a subtle shadow, providing a soft, elevated, and modern appearance.
- Dark hero sections: Strategically used for key information display, leveraging gradient backgrounds for visual depth and focus.
- Navigation: A consistent bottom tab navigation bar provides intuitive access to Home, Schools, Essays, AI Chat, and Planner.
- Welcome/Login page animation: Features a subtle floating logo animation to create an engaging and memorable first impression.