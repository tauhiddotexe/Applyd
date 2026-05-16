// src/data/skills.js

const COMMON_SKILLS = [
  { id: 'react', name: 'React', description: 'Frontend UI library' },
  { id: 'javascript', name: 'JavaScript', description: 'Web programming language' },
  { id: 'typescript', name: 'TypeScript', description: 'Typed JavaScript' },
  { id: 'python', name: 'Python', description: 'General purpose language' },
  { id: 'nodejs', name: 'Node.js', description: 'JavaScript runtime' },
  { id: 'sql', name: 'SQL', description: 'Database query language' },
  { id: 'docker', name: 'Docker', description: 'Containerization' },
  { id: 'aws', name: 'AWS', description: 'Cloud services' },
  { id: 'git', name: 'Git', description: 'Version control' },
  { id: 'tailwindcss', name: 'Tailwind CSS', description: 'Utility-first CSS' },
  { id: 'postgresql', name: 'PostgreSQL', description: 'Relational database' },
  { id: 'fastapi', name: 'FastAPI', description: 'Python web framework' },
  { id: 'nextjs', name: 'Next.js', description: 'React framework' },
  { id: 'mongodb', name: 'MongoDB', description: 'NoSQL database' },
  { id: 'graphql', name: 'GraphQL', description: 'API query language' },
];

export function getSkills() {
  return COMMON_SKILLS;
}
