/**
 * ============================================================================
 *  PROJECT RISHI — SITE CONTENT & LINKS
 * ============================================================================
 *  This is the single place to edit text, links, and which images appear.
 *
 *  HOW TO ADD YOUR OWN MEDIA
 *  -------------------------
 *  1. Drop image files into the `public/images/` folder, e.g.
 *        public/images/hero-village.jpg
 *  2. Reference them with a leading slash (NO "public"):
 *        image: "/images/hero-village.jpg"
 *  3. Any item with `image: null` will show a labelled placeholder box
 *     until you set a real path. The label tells you what belongs there.
 *
 *  HOW TO UPDATE LINKS
 *  -------------------
 *  Every external link lives in the LINKS object below. Replace the
 *  placeholder URLs (marked  // TODO ) with your real ones.
 * ============================================================================
 */

export const ORG = {
  name: "Project RISHI",
  chapter: "UC Berkeley",
  acronym: "Rural India Social & Health Improvement",
  tagline: "Promoting the sustainable development of rural Indian communities.",
  email: "ucberkeley@projectrishi.org",
  address: "2495 Bancroft Way, Berkeley, CA 94720",
  copyright: "© 2025 Project RISHI, The Berkeley Chapter. All Rights Reserved.",
};

/** All external / action links in one place. Replace TODO values. */
export const LINKS = {
  interestForm:
    "https://docs.google.com/forms/d/e/1FAIpQLScHh8LLlhJ1trFqvumbOyLwMwEs-WmFSSGy7m9joKr3ltR9vg/viewform?usp=header", // TODO confirm
  application: "https://forms.gle/hh24ahnY1y6xDjvn9", // TODO confirm
  coffeeChats:
    "https://airtable.com/appk8PXxxHb4TAyx5/shradefRNV5M1umRS/tblM4OrL9P9GCjrVZ", // TODO confirm
  donate: "/donate", // TODO point at your real donation processor
  instagram: "https://www.instagram.com/ucbprojectrishi/?hl=en",
  facebook: "https://www.facebook.com/ucbprojectrishi/",
  nationalSite: "http://www.projectrishi.org/",
  // Newsletter signup endpoint (e.g. a Google Form, Mailchimp, or your own API).
  newsletterAction: "", // TODO add an endpoint, or leave "" to keep it inert
};

export const NAV = [
  { label: "About", href: "/about" },
  {
    label: "Projects",
    href: "/projects",
    children: [
      { label: "Education", href: "/projects/education" },
      { label: "Water & Sanitation", href: "/projects/water-sanitation" },
      { label: "Women's Empowerment", href: "/projects/womens-empowerment" },
      { label: "Health", href: "/projects/health" },
    ],
  },
  { label: "Apply", href: "/apply" },
  { label: "Contact", href: "/contact" },
];

export const HOME = {
  heroEyebrow: "UC Berkeley Chapter",
  heroLine1: "Project",
  heroLine2: "RISHI",
  heroSub: "Rural India Social & Health Improvement",
  // Hero background image — replace with a wide village / team photo.
  heroImage: null as string | null, // e.g. "/images/hero-village.jpg"
  missionTitle: "Our Mission",
  missionBody:
    "Project RISHI promotes the sustainable development and growth of rural Indian communities. We continually expand our resources to support our villagers — identifying issues central to our target communities and providing the means to implement solutions through extensive field research and on-campus initiatives.",
  missionImage: null as string | null, // e.g. "/images/mission.jpg"
  stats: [
    { value: "2008", label: "Berkeley chapter founded" },
    { value: "1,400", label: "Residents in Bharog Baneri" },
    { value: "4", label: "Active project teams" },
  ],
};

export const PROJECTS = [
  {
    slug: "education",
    name: "Education",
    color: "marigold",
    image: null as string | null, // e.g. "/images/projects/education.jpg"
    quote: "Education is not preparation for life; education is life itself.",
    quoteAuthor: "John Dewey",
    intro:
      "Education is dedicated to improving the learning environment and future opportunities for students in Bharog Baneri. We work with schools and community members to improve infrastructure, expand access to technology, promote extracurricular growth, and provide mentorship that supports students beyond secondary school. Our goal is to make sure every student has the resources and support they need to learn, grow, and pursue their aspirations.",
    highlights: [
      {
        title: "Career Panels",
        body: "Between 2022 and 2025 we held a series of career panels at the secondary school, hosting speakers from IIM Sirmaur and the Central University of Himachal Pradesh, giving students the chance to learn about higher-education opportunities and career options.",
        image: null,
      },
      {
        title: "Infrastructural Improvements",
        body: "Improved the secondary school by bringing in 40 desks, adding bathrooms, and installing a water filter — giving students a cleaner, more supportive learning environment.",
        image: null,
      },
    ],
    past: [
      {
        title: "Career Counseling Session",
        body: "Hosted a career counselling session with Dr. Geeta, who discussed the different streams available for students in Bharog.",
      },
      {
        title: "Distribution of Learning Material",
        body: "Distributed Teacher Learning Materials to the primary schools to aid teachers in day-to-day classroom activities.",
      },
      {
        title: "Focus Groups & Student Shadowing",
        body: "Conducted focus-group interviews with students, distributed household surveys, and toured the school to gather insights that inform future projects.",
      },
      {
        title: "Build Desks & Fix Bathrooms",
        body: "Built and funded over 25 desks for the school's students and renovated bathroom infrastructure to improve hygiene.",
      },
    ],
  },
  {
    slug: "water-sanitation",
    name: "Water & Sanitation",
    color: "pine",
    image: null as string | null,
    quote: "A drop harvested is a crop harvested.",
    quoteAuthor: "",
    intro:
      "The Water & Sanitation team is committed to increasing safe, clean water access across Bharog Baneri by building rainwater-harvesting systems and testing common drinking-water sources. We are also rebuilding and cleaning heavily-used wells for safe drinking use. Our goal is to ensure the entire village has water that is not only clean, but abundant in supply.",
    highlights: [
      {
        title: "Rainwater Harvesting Systems",
        body: "Built 7 rainwater-harvesting systems across the village, providing several thousand litres of water access for crop irrigation.",
        image: null,
      },
      {
        title: "Filter Distribution",
        body: "Distributed and installed bio-sand water filters for clean drinking water across Bharog Baneri.",
        image: null,
      },
    ],
    past: [
      {
        title: "Water Testing",
        body: "Tested 10+ locations across the village for coliform and E. coli contamination.",
      },
      {
        title: "Gather Data & Build",
        body: "Completed 8 remote builds and identified new recipients through general surveying. Geotagged past rainwater-harvesting recipients and trained Naresh Ji to manage future geotagging.",
      },
      {
        title: "TGIF Grant",
        body: "Organized a rainwater-harvesting design-a-thon and a sustainable-development speaker panel in Fall 2021 to create direct impact within the UC Berkeley community.",
      },
      {
        title: "Remote Construction",
        body: "Worked closely with village contacts and builders to carefully choose recipients based on need for remote systems.",
      },
    ],
  },
  {
    slug: "womens-empowerment",
    name: "Women's Empowerment",
    color: "marigold",
    image: null as string | null,
    quote: "Women are the future of society.",
    quoteAuthor: "",
    intro:
      "Our Women's Empowerment team is committed to creating lasting impact by uplifting and supporting women across rural India. Through menstrual-health education, skill-building workshops, and economic-opportunity initiatives, we work to empower women with the tools and resources they need to flourish. From reusable-pad distribution events to partnerships with local entrepreneurs, our mission is simple: to amplify voices, foster independence, and build stronger communities together.",
    highlights: [
      {
        title: "Reusable Pad Distributions",
        body: "Hosted reusable-pad distribution events at a local school and partnered with existing community groups — combining access to sustainable menstrual products with women's-health education. Together we are breaking stigma, fostering confidence, and creating lasting impact for women and girls across rural India.",
        image: null,
      },
      {
        title: "Small Business Support",
        body: "We are exploring small-business opportunities that uplift women and strengthen communities — from dairy-farming initiatives to basket-weaving collectives — creating sustainable pathways to independence, skills, and family support.",
        image: null,
      },
    ],
    past: [
      {
        title: "Menstrual & Telehealth Workshop",
        body: "Partnered with PINKISHE to train teachers as Certified Menstrual Health Educators, organized a career panel at a secondary school, and partnered with Tele-Upchaar to host a telehealth event.",
      },
      {
        title: "Gynecologist Telehealth Program",
        body: "Piloted a telehealth program at the Public Health Center with TeleUpchaar, providing remote gynecological consultations for women in the village in coordination with the local doctor and a health worker.",
      },
      {
        title: "Health & Hygiene Workshop",
        body: "Partnered with PINKISHE to distribute 1,000 reusable pads and brought in a female gynecologist who presented to 200 women and girls about menstrual health and hygiene.",
      },
      {
        title: "Financial Empowerment Camp",
        body: "Hosted a Women's Financial Empowerment Camp teaching financial independence, plus basket-weaving sessions with the Mahila Mandal group to help village women sell their products.",
      },
    ],
  },
  {
    slug: "health",
    name: "Health",
    color: "pine",
    image: null as string | null,
    quote:
      "For he who has health has hope; and he who has hope, has everything.",
    quoteAuthor: "Owen Arthur",
    intro:
      "Health is dedicated to improving the overall wellbeing of Bharog Baneri. We work with villagers to increase access to specialized medical services — dental, eyecare, women's health, and more — aiming to alleviate disparities in access to quality healthcare while addressing each community's specific needs.",
    highlights: [
      {
        title: "Dental Camps",
        body: "Held a 3-day dental camp providing in-depth care to villagers. We treated 250+ people, offering everything from general cleanings to extractions.",
        image: null,
      },
      {
        title: "Waste Disposal Pilot",
        body: "Built a dumpster in one ward and distributed trash cans to every household to test a larger-scale waste-disposal scheme.",
        image: null,
      },
    ],
    past: [
      {
        title: "Trash Can Distribution (2024)",
        body: "Distributed 120+ trash cans for wet and dry waste to each household in Ward 1, and designed, finalized, and funded a large communal dumpster for the ward.",
      },
      {
        title: "Telehealth Initiative (Fall 2021)",
        body: "Built a foundational telehealth outline at the Bharog PHC — an informal WhatsApp-based platform to ease access to medical advice.",
      },
      {
        title: "Cancer Education Camp (2019)",
        body: "Ran educational camps with Global Cancer Concern India (GCCI) to help alleviate villagers' stress around cancer.",
      },
      {
        title: "Ocular Camp (2017–2018)",
        body: "Collaborated with VisionSpring to host ocular camps; an optometrist screened villagers and delivered reading and prescription glasses as needed.",
      },
    ],
  },
];

export const ABOUT = {
  heading: "An NGO that moves forward",
  mission: {
    title: "Mission & Values",
    body: "We take pride in promoting the sustainable development and growth of rural communities in India. In partnership with local community members, leaders, and social enterprises, we identify issues central to our target communities and provide the resources to implement solutions.",
  },
  methodology: {
    title: "5-Step Methodology",
    steps: ["Understand", "Research", "Finance", "Implement", "Evaluate"],
  },
  history: {
    title: "History",
    body: "Project RISHI is a student-run, non-profit organization registered in the United States and India. It was founded in 2005 at UCLA by Dr. Eri Srivatsan. Project RISHI Berkeley, founded in 2008, began working with the village of Bharog Baneri, Himachal Pradesh, in 2012.",
  },
  location: {
    title: "Location",
    body: "Bharog Baneri is a village of 1,400 people in the Sirmaur District of Himachal Pradesh, India. Close to the Himalayan foothills, it has hilly terrain and lies roughly a mile above sea level. The village is split into 5 wards, with 1 school and a primary health center.",
  },
  // Gallery slots for the "Life at Project RISHI" section.
  // Add images to public/images/gallery/ and list their paths here.
  gallery: [null, null, null, null, null, null] as (string | null)[],
  // Team photo — replace with your group picture.
  teamImage: null as string | null,
  chapters: [
    { name: "Northwestern University", url: "https://www.facebook.com/nuprishi/" },
    { name: "Vanderbilt University", url: "https://www.facebook.com/ProjectRISHIVanderbilt/" },
    { name: "Purdue University", url: "https://www.facebook.com/purdueprojectrishi/" },
    { name: "University of Michigan", url: "https://projectrishi1920.wixsite.com/projectrishi" },
    { name: "University of Pittsburgh", url: "https://www.facebook.com/pittprojectrishi/" },
    { name: "UC Merced", url: "https://www.facebook.com/Project-RISHI-at-UC-Merced-120723732844915/" },
    { name: "UC Santa Barbara", url: "https://www.facebook.com/projectrishiucsb/" },
    { name: "UC Davis", url: "https://www.facebook.com/projectrishiatucd" },
    { name: "UCLA", url: "https://www.facebook.com/projectrishiucla/" },
    { name: "USC", url: "https://www.scprojectrishi.org/" },
    { name: "UC Irvine", url: "https://projectrishiuci.weebly.com/" },
    { name: "Cal Poly Pomona", url: "https://www.instagram.com/projectrishicpp/?hl=en" },
    { name: "UC Riverside", url: "https://www.facebook.com/ucrprishi/" },
    { name: "UC San Diego", url: "https://www.facebook.com/projectrishiUCSD/" },
    { name: "National Webpage", url: "http://www.projectrishi.org/" },
  ],
};

export const APPLY = {
  heading: "Thank you for your interest in Project RISHI!",
  termLabel: "Fall 2025 Recruitment",
  // Recruitment timeline — edit dates each cycle.
  timeline: [
    { label: "Coffee Chats", value: "Aug 28 – Sep 5" },
    { label: "Info Session #1", value: "Sep 4" },
    { label: "Info Session #2", value: "Sep 11" },
    { label: "Applications Due", value: "Sep 12" },
  ],
  blurb:
    "We recruit at the start of the Fall and Spring semesters. Come meet us at a coffee chat or info session, then submit your application below.",
};
