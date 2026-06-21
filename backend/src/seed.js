require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const connectDb = require("./config/db");
const User = require("./models/User");
const Job = require("./models/Job");
const Skill = require("./models/Skill");
const LearningResource = require("./models/LearningResource");
const SystemConfig = require("./models/SystemConfig");
const AuditLog = require("./models/AuditLog");
const Notification = require("./models/Notification");

async function seed() {
  await connectDb();

  // Clean existing collections
  await Promise.all([
    User.deleteMany({}),
    Job.deleteMany({}),
    Skill.deleteMany({}),
    LearningResource.deleteMany({}),
    SystemConfig.deleteMany({}),
    AuditLog.deleteMany({}),
    Notification.deleteMany({})
  ]);

  console.log("Database cleared.");

  // 1. Create Default Config
  const config = await SystemConfig.create({
    skillWeight: 70,
    interestWeight: 30
  });
  console.log("Default recommendation weights configured.");

  // 2. Create Skill Taxonomy
  const skillsList = [
    { name: "React", category: "Web Development", description: "A JavaScript library for building user interfaces" },
    { name: "Node.js", category: "Web Development", description: "JavaScript runtime built on Chrome's V8 engine" },
    { name: "Express.js", category: "Web Development", description: "Fast, unopinionated, minimalist web framework for Node.js" },
    { name: "MongoDB", category: "Database", description: "Document-based distributed NoSQL database" },
    { name: "JavaScript", category: "Programming Languages", description: "High-level, dynamic, untyped, and interpreted programming language" },
    { name: "TypeScript", category: "Programming Languages", description: "Strict syntactical superset of JavaScript adding optional static typing" },
    { name: "Python", category: "Programming Languages", description: "High-level general-purpose programming language" },
    { name: "SQL", category: "Database", description: "Structured Query Language for managing relational databases" },
    { name: "Figma", category: "UI/UX Design", description: "Collaborative interface design tool" },
    { name: "HTML5/CSS3", category: "Web Development", description: "Standard languages for creating web page structure and styles" },
    { name: "Docker", category: "Cloud Engineering", description: "Set of platform as a service products using OS-level virtualization to deliver software in packages" },
    { name: "AWS", category: "Cloud Engineering", description: "Amazon Web Services cloud computing platform" },
    { name: "Machine Learning", category: "Data Science", description: "Scientific study of algorithms and statistical models used by computer systems" },
    { name: "Data Analysis", category: "Data Science", description: "Process of inspecting, cleansing, transforming, and modeling data" },
    { name: "Pandas", category: "Data Science", description: "Python library for data manipulation and analysis" }
  ];

  const seededSkills = await Skill.create(skillsList);
  console.log(`${seededSkills.length} skills added to taxonomy.`);

  // 3. Create Curated Learning Resources
  const resourcesList = [
    {
      title: "Full-Stack Web Development with React Specialization",
      provider: "Coursera",
      url: "https://www.coursera.org/specializations/full-stack-react",
      skillsTaught: ["React", "HTML5/CSS3", "JavaScript", "Node.js", "Express.js"],
      type: "course"
    },
    {
      title: "Python for Everybody Specialization",
      provider: "Coursera",
      url: "https://www.coursera.org/specializations/python",
      skillsTaught: ["Python", "Data Analysis"],
      type: "course"
    },
    {
      title: "Ultimate AWS Certified Cloud Practitioner",
      provider: "Udemy",
      url: "https://www.udemy.com/course/aws-certified-cloud-practitioner-new/",
      skillsTaught: ["AWS"],
      type: "course"
    },
    {
      title: "MongoDB Certified Developer Associate",
      provider: "MongoDB University",
      url: "https://learn.mongodb.com/pages/certification",
      skillsTaught: ["MongoDB"],
      type: "certification"
    },
    {
      title: "Google Data Analytics Professional Certificate",
      provider: "Coursera",
      url: "https://www.coursera.org/professional-certificates/google-data-analytics",
      skillsTaught: ["Data Analysis", "SQL"],
      type: "certification"
    },
    {
      title: "Figma UI/UX Design Essentials",
      provider: "Udemy",
      url: "https://www.udemy.com/course/figma-uiux-design-essentials/",
      skillsTaught: ["Figma", "HTML5/CSS3"],
      type: "course"
    },
    {
      title: "Docker Certified Associate Preparatory Course",
      provider: "Udemy",
      url: "https://www.udemy.com/course/docker-certified-associate/",
      skillsTaught: ["Docker"],
      type: "course"
    }
  ];

  const seededResources = await LearningResource.create(resourcesList);
  console.log(`${seededResources.length} learning resources seeded.`);

  // 4. Create User Accounts
  const hashedPassword = await bcrypt.hash("password123", 12);
  
  const usersData = [
    {
      name: "Ahmad Mashhood",
      email: "student@talentmap.edu",
      password: hashedPassword,
      role: "student",
      experienceLevel: "entry",
      skills: ["React", "HTML5/CSS3", "JavaScript", "Figma"],
      interests: ["Web Development", "UI/UX Design"],
      careerGoals: "Aiming to become a Full Stack Developer or a Frontend UI/UX engineer within a modern tech startup."
    },
    {
      name: "Muhammad Salman",
      email: "manager@talentmap.edu",
      password: hashedPassword,
      role: "staff", // Content Manager
    },
    {
      name: "Dr. Waseem Akram",
      email: "admin@talentmap.edu",
      password: hashedPassword,
      role: "admin", // Administrator
    },
    {
      name: "Super Administrator",
      email: "superadmin@talentmap.edu",
      password: hashedPassword,
      role: "super_admin", // Super Admin
    }
  ];

  const seededUsers = await User.create(usersData);
  console.log(`${seededUsers.length} users registered.`);

  // Fetch student & admin references
  const studentUser = seededUsers.find(u => u.role === "student");
  const adminUser = seededUsers.find(u => u.role === "admin");

  // 5. Create Job Listings
  const jobsList = [
    {
      title: "Full Stack Developer",
      description: "We are looking for a Junior Full Stack Developer comfortable with React and Node.js. You will work on building scalable user interfaces and RESTful APIs, and maintaining database integrations using MongoDB.",
      company: "ByteCrafters",
      location: "Islamabad",
      category: "Web Development",
      requiredSkills: ["React", "Node.js", "Express.js", "MongoDB", "JavaScript"],
      experienceLevel: "entry",
      salaryRange: "$800 - $1,200 / month",
      postedBy: adminUser._id
    },
    {
      title: "Data Analyst",
      description: "Join Innova Analytics to clean, visualize, and model data. The ideal candidate has expertise in SQL queries, Python scripts, and Pandas for reading and analyzing structured spreadsheets.",
      company: "Innova Analytics",
      location: "Lahore",
      category: "Data Science",
      requiredSkills: ["SQL", "Python", "Data Analysis", "Pandas"],
      experienceLevel: "mid",
      salaryRange: "$1,200 - $1,800 / month",
      postedBy: adminUser._id
    },
    {
      title: "DevOps Cloud Engineer",
      description: "CloudScale is seeking a senior cloud professional to deploy and maintain high-availability systems on AWS. Docker containerization and strong scripting using TypeScript/Node are mandatory.",
      company: "CloudScale Solutions",
      location: "Remote",
      category: "Cloud Engineering",
      requiredSkills: ["Docker", "AWS", "Node.js", "TypeScript"],
      experienceLevel: "senior",
      salaryRange: "$2,500 - $3,500 / month",
      postedBy: adminUser._id
    },
    {
      title: "UI/UX Engineer",
      description: "PixelSoft is hiring an Entry UI/UX designer who can translate wireframes to high-fidelity frontend templates. Experience in Figma, standard HTML5 layout models, and basic React components is desired.",
      company: "PixelSoft",
      location: "Vehari",
      category: "UI/UX Design",
      requiredSkills: ["Figma", "HTML5/CSS3", "React", "JavaScript"],
      experienceLevel: "entry",
      salaryRange: "$600 - $900 / month",
      postedBy: adminUser._id
    },
    {
      title: "Machine Learning Engineer",
      description: "DeepMind Pakistan is hiring a mid-level machine learning practitioner to build, evaluate, and scale predictive intelligence models. Experience with Python, training data, and data munging is required.",
      company: "DeepMind Pakistan",
      location: "Karachi",
      category: "Data Science",
      requiredSkills: ["Python", "Machine Learning", "Data Analysis", "Pandas"],
      experienceLevel: "mid",
      salaryRange: "$2,000 - $2,800 / month",
      postedBy: adminUser._id
    }
  ];

  const seededJobs = await Job.create(jobsList);
  console.log(`${seededJobs.length} job postings published.`);

  // 6. Create Initial Notifications
  await Notification.create({
    user: studentUser._id,
    title: "Welcome to TalentMap!",
    message: "Create your profile, select your skills and interests, and view custom job recommendations instantly."
  });

  // 7. Log seeding activity
  await AuditLog.create({
    actor: adminUser._id,
    action: "system_seeding",
    target: "database reset and initial seed"
  });

  console.log("Demo database successfully seeded!");
  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error("Seeding failed:", error);
  await mongoose.disconnect();
  process.exit(1);
});
