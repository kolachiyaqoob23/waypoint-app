
'use strict';

// Waypoint starter learning content.
// Sample content only; original curriculum must be restored separately.

const BANDS = [
  { id: 'foundation', title: 'Foundation', minGrade: 1, maxGrade: 5 },
  { id: 'intermediate', title: 'Intermediate', minGrade: 6, maxGrade: 8 },
  { id: 'advanced', title: 'Advanced', minGrade: 9, maxGrade: 12 }
];

function bandOf(grade) {
  const g = Number(grade) || 1;
  if (g <= 5) return 'foundation';
  if (g <= 8) return 'intermediate';
  return 'advanced';
}

const SUBJECTS = [
  {
    id: 'mathematics',
    title: 'Mathematics',
    area: 'STEM',
    blurb: 'Build your mathematical skills through practice.',
    bands: ['foundation', 'intermediate', 'advanced'],
    resources: [],
    topics: [
      {
        id: 'math-arithmetic',
        name: 'Arithmetic',
        lesson: 'Addition combines quantities. Multiplication is repeated addition. Division splits a quantity into equal groups.',
        points: [
          'Addition combines numbers.',
          'Multiplication can represent equal groups.',
          'Division shares quantities equally.'
        ],
        resources: [],
        questions: [
          {
            id: 'math-a1',
            q: 'What is 7 + 5?',
            opts: ['12', '11', '13', '10'],
            why: 'Seven plus five equals twelve.'
          },
          {
            id: 'math-a2',
            q: 'What is 6 × 4?',
            opts: ['24', '20', '10', '28'],
            why: 'Six groups of four make twenty-four.'
          },
          {
            id: 'math-a3',
            q: 'What is 20 ÷ 5?',
            opts: ['4', '5', '10', '15'],
            why: 'Twenty divided into five equal groups gives four in each group.'
          }
        ]
      },
      {
        id: 'math-fractions',
        name: 'Fractions',
        lesson: 'A fraction represents part of a whole. The numerator is above the fraction bar and the denominator is below it.',
        points: [
          'The numerator counts the parts.',
          'The denominator describes the total equal parts.',
          'Equivalent fractions represent the same value.'
        ],
        resources: [],
        questions: [
          {
            id: 'math-f1',
            q: 'Which fraction is equal to 1/2?',
            opts: ['2/4', '1/3', '3/4', '2/3'],
            why: 'Two quarters simplifies to one half.'
          },
          {
            id: 'math-f2',
            q: 'What is 1/4 + 1/4?',
            opts: ['1/2', '1/8', '2/8', '1'],
            why: 'One quarter plus one quarter equals two quarters, or one half.'
          },
          {
            id: 'math-f3',
            q: 'In the fraction 3/5, what is the denominator?',
            opts: ['5', '3', '8', '2'],
            why: 'The denominator is the bottom number: five.'
          }
        ]
      }
    ]
  },
  {
    id: 'science',
    title: 'Science',
    area: 'STEM',
    blurb: 'Explore living things and the natural world.',
    bands: ['foundation', 'intermediate', 'advanced'],
    resources: [],
    topics: [
      {
        id: 'science-plants',
        name: 'Plants',
        lesson: 'Plants use sunlight, water and carbon dioxide to make food through photosynthesis.',
        points: [
          'Roots absorb water and minerals.',
          'Leaves are major sites of photosynthesis.',
          'Sunlight supplies energy for photosynthesis.'
        ],
        resources: [],
        questions: [
          {
            id: 'science-p1',
            q: 'Which part of most plants absorbs water from soil?',
            opts: ['Roots', 'Flowers', 'Fruits', 'Petals'],
            why: 'Roots absorb water and minerals from the soil.'
          },
          {
            id: 'science-p2',
            q: 'What is the main energy source for photosynthesis?',
            opts: ['Sunlight', 'Soil', 'Oxygen', 'Wind'],
            why: 'Plants use energy from sunlight during photosynthesis.'
          },
          {
            id: 'science-p3',
            q: 'Which gas do plants take in during photosynthesis?',
            opts: ['Carbon dioxide', 'Helium', 'Hydrogen', 'Neon'],
            why: 'Plants use carbon dioxide to make sugars.'
          }
        ]
      },
      {
        id: 'science-matter',
        name: 'States of Matter',
        lesson: 'Matter commonly exists as a solid, liquid or gas. These states differ in shape, volume and particle movement.',
        points: [
          'Solids keep their shape.',
          'Liquids flow and take the shape of their container.',
          'Gases spread out to fill their container.'
        ],
        resources: [],
        questions: [
          {
            id: 'science-m1',
            q: 'Which state of matter has a fixed shape?',
            opts: ['Solid', 'Liquid', 'Gas', 'Vapour only'],
            why: 'A solid generally retains its own shape.'
          },
          {
            id: 'science-m2',
            q: 'What happens when ice melts?',
            opts: ['It becomes liquid water', 'It becomes oxygen', 'It becomes soil', 'It disappears completely'],
            why: 'Melting changes solid ice into liquid water.'
          },
          {
            id: 'science-m3',
            q: 'Which state usually fills all available space in a container?',
            opts: ['Gas', 'Solid', 'Crystal only', 'Ice'],
            why: 'A gas expands to fill its container.'
          }
        ]
      }
    ]
  }
];

function topicResources(subject, topic, grade) {
  return topic.resources || subject.resources || [];
}

module.exports = {
  BANDS,
  SUBJECTS,
  bandOf,
  topicResources
};
