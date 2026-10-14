'use strict';
/* ============================================================
   Waypoint content: class bands, subjects, topics, questions, resources.
   In every question, opts[0] is the correct answer (options are shuffled
   by the server before they are sent to the student).
   To add a subject, copy one of the objects below and add it to SUBJECTS.
   ============================================================ */

const BANDS = [
  { id: 'primary',   label: 'Primary',                          range: 'Class 1–5',  min: 1,  max: 5 },
  { id: 'middle',    label: 'Middle',                           range: 'Class 6–8',  min: 6,  max: 8 },
  { id: 'secondary', label: 'Secondary (Matric)',               range: 'Class 9–10', min: 9,  max: 10 },
  { id: 'higher',    label: 'Higher Secondary (Intermediate)',  range: 'Class 11–12', min: 11, max: 12 }
];
const bandOf = g => BANDS.find(b => g >= b.min && g <= b.max) || null;

const SUBJECTS = [
/* ---------------------------------------------------------- FRACTIONS */
{
  id: 'fra', title: 'Fractions & decimals', area: 'Mathematics', kw: 'fractions decimals',
  blurb: 'Fractions, decimals and percentages, step by step.',
  bands: ['primary', 'middle'],
  resources: [
    { type: 'Course',   title: 'Khan Academy: Arithmetic',          url: 'https://www.khanacademy.org/math/arithmetic', note: 'Free video lessons with practice questions.' },
    { type: 'Read',     title: 'Math is Fun: Fractions',            url: 'https://www.mathsisfun.com/fractions.html', note: 'Short, picture-based explanations.' },
    { type: 'Course',   title: 'BBC Bitesize: Maths',               url: 'https://www.bbc.co.uk/bitesize', note: 'Revision guides and quizzes by age.' }
  ],
  topics: [
    { id: 'frac', name: 'Understanding fractions', kw: 'fractions equivalent simplify',
      lesson: 'A fraction shows equal parts of a whole. The denominator (bottom number) says how many equal parts the whole is split into, and the numerator (top number) says how many parts you have. Equivalent fractions look different but have the same value, like 1/2 and 2/4. To simplify, divide the top and bottom by the same number. When the numerators are equal, the fraction with the smaller denominator is larger.',
      points: ['Denominator = total equal parts; numerator = parts you have.', 'Multiply or divide top and bottom by the same number to get an equivalent fraction.', 'Simplify by dividing by common factors.', 'Same numerator: smaller denominator means a bigger fraction.'],
      questions: [
        { id: 'frac1', q: 'Which fraction is equivalent to 1/2?', opts: ['2/4', '2/3', '1/4', '3/5'], why: 'Multiply the top and bottom of 1/2 by 2 to get 2/4.' },
        { id: 'frac2', q: 'Simplify 6/8.', opts: ['3/4', '1/2', '2/3', '4/3'], why: 'Divide both 6 and 8 by 2 to get 3/4.' },
        { id: 'frac3', q: 'In the fraction 3/5, what does the 5 tell you?', opts: ['The whole is split into 5 equal parts', 'You have 5 parts', 'There are 3 wholes', 'The fraction is bigger than 1'], why: 'The denominator shows how many equal parts make the whole.' },
        { id: 'frac4', q: 'Which fraction is the greatest?', opts: ['1/2', '1/3', '1/4', '1/8'], why: 'With the same numerator, the smaller the denominator, the bigger each piece is.' }
      ] },
    { id: 'fadd', name: 'Adding & subtracting fractions', kw: 'adding subtracting fractions',
      lesson: 'When the denominators are the same, add or subtract only the numerators and keep the denominator. When they are different, first rewrite the fractions with a common denominator (a common multiple of both), then add or subtract. Simplify the answer at the end.',
      points: ['Same denominator: add the numerators, keep the denominator.', 'Different denominators: find a common denominator first.', 'Never add the denominators together.', 'Simplify the final answer.'],
      questions: [
        { id: 'fadd1', q: 'What is 1/4 + 2/4?', opts: ['3/4', '3/8', '2/8', '1/3'], why: 'The denominators match, so add the numerators: 1 + 2 = 3, giving 3/4.' },
        { id: 'fadd2', q: 'What is 1/2 + 1/3?', opts: ['5/6', '2/5', '2/6', '1/6'], why: 'Use denominator 6: 3/6 + 2/6 = 5/6.' },
        { id: 'fadd3', q: 'What is 3/4 − 1/4?', opts: ['1/2', '2/8', '3/4', '1/4'], why: '3 − 1 = 2, so 2/4, which simplifies to 1/2.' },
        { id: 'fadd4', q: 'What is 2/3 + 1/6?', opts: ['5/6', '3/9', '3/6', '7/6'], why: 'Rewrite 2/3 as 4/6. Then 4/6 + 1/6 = 5/6.' }
      ] },
    { id: 'dec', name: 'Decimals & place value', kw: 'decimals place value',
      lesson: 'In a decimal, each place to the right of the point is ten times smaller: tenths, hundredths, thousandths. To compare decimals, compare digit by digit from the left, and remember 0.5 is bigger than 0.45. To add decimals, line up the decimal points. Multiplying by 10 moves the digits one place to the left.',
      points: ['Places after the point: tenths, hundredths, thousandths.', 'Compare digit by digit from the left.', 'Line up decimal points when adding.', '× 10 shifts digits one place left.'],
      questions: [
        { id: 'dec1', q: 'In 3.472, what is the value of the digit 7?', opts: ['7 hundredths (0.07)', '7 tenths (0.7)', '7 thousandths (0.007)', '7 ones'], why: 'After the point: 4 is tenths, 7 is hundredths, 2 is thousandths.' },
        { id: 'dec2', q: 'Which decimal is the greatest?', opts: ['0.5', '0.45', '0.405', '0.095'], why: '0.5 has 5 tenths. The others have 4 tenths or fewer.' },
        { id: 'dec3', q: 'What is 0.3 + 0.25?', opts: ['0.55', '0.28', '0.325', '0.75'], why: 'Write 0.30 + 0.25 = 0.55.' },
        { id: 'dec4', q: 'What is 1.5 × 10?', opts: ['15', '1.50', '0.15', '150'], why: 'Multiplying by 10 moves the digits one place left: 15.' }
      ] },
    { id: 'conv', name: 'Fractions, decimals & percentages', kw: 'convert fractions decimals percentages',
      lesson: 'A percentage means "out of 100". To change a fraction to a decimal, divide the top by the bottom (1/4 = 1 ÷ 4 = 0.25). To change a decimal to a percentage, multiply by 100. To change a percentage to a fraction, put it over 100 and simplify.',
      points: ['Fraction → decimal: divide numerator by denominator.', 'Decimal → percentage: multiply by 100.', 'Percentage → fraction: write over 100, then simplify.', '50% = 0.5 = 1/2.'],
      questions: [
        { id: 'conv1', q: 'Write 1/4 as a decimal.', opts: ['0.25', '0.14', '0.4', '2.5'], why: '1 ÷ 4 = 0.25.' },
        { id: 'conv2', q: 'Write 0.75 as a fraction in simplest form.', opts: ['3/4', '7/5', '1/75', '75/10'], why: '0.75 = 75/100, and dividing top and bottom by 25 gives 3/4.' },
        { id: 'conv3', q: 'Write 20% as a fraction in simplest form.', opts: ['1/5', '1/2', '2/5', '1/20'], why: '20% = 20/100, and dividing by 20 gives 1/5.' },
        { id: 'conv4', q: 'Write 3/5 as a percentage.', opts: ['60%', '35%', '53%', '30%'], why: '3/5 = 6/10 = 60/100 = 60%.' }
      ] }
  ]
},
/* ------------------------------------------------------------ ALGEBRA */
{
  id: 'alg', title: 'Algebra basics', area: 'Mathematics', kw: 'algebra',
  blurb: 'Equations, exponents, factoring and straight lines.',
  bands: ['middle', 'secondary'],
  resources: [
    { type: 'Course', title: 'Khan Academy: Algebra', url: 'https://www.khanacademy.org/math/algebra', note: 'Complete free course with exercises.' },
    { type: 'Read',   title: 'Math is Fun: Algebra', url: 'https://www.mathsisfun.com/algebra/', note: 'Plain-language explanations with examples.' },
    { type: 'Tool',   title: 'Desmos graphing calculator', url: 'https://www.desmos.com/calculator', note: 'Draw lines and quadratics to see how they behave.' }
  ],
  topics: [
    { id: 'lin', name: 'Linear equations', kw: 'solving linear equations',
      lesson: 'To solve a linear equation, do the same operation to both sides until the variable stands alone. Undo addition and subtraction first, then multiplication and division. Expand brackets and combine like terms before you start. Always check by substituting your answer back in.',
      points: ['Whatever you do to one side, do to the other.', 'Expand brackets first: 2(x − 4) = 2x − 8.', 'Collect variable terms on one side, numbers on the other.', 'Check the answer by substitution.'],
      questions: [
        { id: 'lin1', q: 'Solve: 3x + 5 = 20', opts: ['x = 5', 'x = 15', 'x = 25/3', 'x = 10'], why: 'Subtract 5: 3x = 15. Divide by 3: x = 5.' },
        { id: 'lin2', q: 'Solve: 2(x − 4) = 10', opts: ['x = 9', 'x = 7', 'x = 3', 'x = 14'], why: 'Divide by 2: x − 4 = 5, so x = 9. Choosing 7 comes from forgetting to multiply the 4 by 2.' },
        { id: 'lin3', q: 'Solve: 5x − 3 = 2x + 9', opts: ['x = 4', 'x = 2', 'x = 6', 'x = 12/7'], why: 'Subtract 2x: 3x − 3 = 9. Add 3: 3x = 12. So x = 4.' },
        { id: 'lin4', q: 'Solve: x/4 + 2 = 6', opts: ['x = 16', 'x = 8', 'x = 32', 'x = 1'], why: 'Subtract 2: x/4 = 4. Multiply by 4: x = 16.' }
      ] },
    { id: 'exp', name: 'Exponents & powers', kw: 'laws of exponents',
      lesson: 'Exponent laws let you simplify powers with the same base. Multiplying adds exponents, dividing subtracts them, and raising a power to a power multiplies them. Any non-zero number to the power 0 equals 1, and a negative exponent means a reciprocal.',
      points: ['aᵐ · aⁿ = aᵐ⁺ⁿ', 'aᵐ / aⁿ = aᵐ⁻ⁿ', '(aᵐ)ⁿ = aᵐⁿ', 'a⁰ = 1 and a⁻ⁿ = 1/aⁿ'],
      questions: [
        { id: 'exp1', q: 'Simplify: 2³ · 2⁴', opts: ['2⁷', '2¹²', '4⁷', '2¹'], why: 'Same base, so add the exponents: 3 + 4 = 7.' },
        { id: 'exp2', q: 'Simplify: (3²)³', opts: ['3⁶', '3⁵', '3⁸', '9⁵'], why: 'A power raised to a power multiplies exponents: 2 × 3 = 6.' },
        { id: 'exp3', q: 'What is 5⁰?', opts: ['1', '0', '5', 'Undefined'], why: 'Any non-zero number to the power 0 equals 1.' },
        { id: 'exp4', q: 'What is 2⁻³?', opts: ['1/8', '−8', '−6', '1/6'], why: 'A negative exponent means reciprocal: 2⁻³ = 1/2³ = 1/8.' }
      ] },
    { id: 'fac', name: 'Factoring quadratics', kw: 'factoring quadratics',
      lesson: 'To factor x² + bx + c, find two numbers that multiply to c and add to b. Check by expanding. A difference of squares factors as a² − b² = (a − b)(a + b). To solve a quadratic equation, factor it, set each bracket to zero and solve.',
      points: ['Find two numbers: product = c, sum = b.', 'Check by expanding the brackets.', 'a² − b² = (a − b)(a + b)', 'Zero product rule: if (x − p)(x − q) = 0 then x = p or x = q.'],
      questions: [
        { id: 'fac1', q: 'Factor: x² + 5x + 6', opts: ['(x + 2)(x + 3)', '(x + 1)(x + 6)', '(x − 2)(x − 3)', '(x + 5)(x + 6)'], why: '2 × 3 = 6 and 2 + 3 = 5.' },
        { id: 'fac2', q: 'Factor: x² − 9', opts: ['(x − 3)(x + 3)', '(x − 3)²', '(x + 3)²', '(x − 9)(x + 1)'], why: 'This is a difference of squares: x² − 3².' },
        { id: 'fac3', q: 'Solve: x² − 7x + 12 = 0', opts: ['x = 3 or x = 4', 'x = −3 or x = −4', 'x = 2 or x = 6', 'x = 7 or x = 12'], why: 'Factor to (x − 3)(x − 4) = 0, so x = 3 or 4.' },
        { id: 'fac4', q: 'Factor: x² + x − 12', opts: ['(x + 4)(x − 3)', '(x − 4)(x + 3)', '(x + 6)(x − 2)', '(x + 12)(x − 1)'], why: 'You need a product of −12 and a sum of +1: 4 and −3.' }
      ] },
    { id: 'slo', name: 'Slope & graphs', kw: 'slope of a line graphs',
      lesson: 'Slope measures steepness: m = (y₂ − y₁) / (x₂ − x₁), the rise over the run. In y = mx + b, m is the slope and b is where the line crosses the y-axis. Parallel lines have equal slopes. Perpendicular lines have slopes that are negative reciprocals.',
      points: ['m = rise / run', 'y = mx + b: slope m, y-intercept b', 'Parallel lines: same slope', 'Perpendicular lines: slopes multiply to −1'],
      questions: [
        { id: 'slo1', q: 'What is the slope of the line through (1, 2) and (3, 8)?', opts: ['3', '1/3', '6', '2'], why: '(8 − 2) / (3 − 1) = 6/2 = 3.' },
        { id: 'slo2', q: 'What is the y-intercept of y = −2x + 7?', opts: ['7', '−2', '3.5', '0'], why: 'In y = mx + b the y-intercept is b, which is 7.' },
        { id: 'slo3', q: 'Which line is parallel to y = 4x − 1?', opts: ['y = 4x + 5', 'y = −4x − 1', 'y = x/4 − 1', 'y = −x/4 + 5'], why: 'Parallel lines share the same slope, 4.' },
        { id: 'slo4', q: 'What is the slope of a line perpendicular to y = 2x + 3?', opts: ['−1/2', '2', '−2', '1/2'], why: 'Flip 2 to get 1/2, then change the sign: −1/2.' }
      ] }
  ]
},
/* ---------------------------------------------------------- BIOLOGY */
{
  id: 'bio', title: 'Photosynthesis', area: 'Biology', kw: 'photosynthesis',
  blurb: 'How plants turn light, water and CO₂ into sugar.',
  bands: ['secondary', 'higher'],
  resources: [
    { type: 'Course', title: 'Khan Academy: Biology', url: 'https://www.khanacademy.org/science/biology', note: 'Video lessons and practice for the whole subject.' },
    { type: 'Read',   title: 'BioNinja', url: 'https://ib.bioninja.com.au/', note: 'Concise revision notes with diagrams.' },
    { type: 'Read',   title: 'CK-12 FlexBooks', url: 'https://www.ck12.org/', note: 'Free online textbooks with exercises.' },
    { type: 'Read',   title: 'Wikipedia: Photosynthesis', url: 'https://en.wikipedia.org/wiki/Photosynthesis', note: 'A detailed reference article.' }
  ],
  topics: [
    { id: 'pig', name: 'Chloroplasts & pigments', kw: 'chloroplast chlorophyll pigments',
      lesson: 'Photosynthesis happens inside chloroplasts. Stacks of thylakoid membranes (grana) hold the chlorophyll that captures light; the fluid around them is the stroma. Chlorophyll a and b absorb mostly red and blue light and reflect green, which is why leaves look green. Accessory pigments such as carotenoids capture extra wavelengths and protect chlorophyll from damage.',
      points: ['Light reactions happen in the thylakoid membranes; the Calvin cycle happens in the stroma.', 'Chlorophyll absorbs red and blue light and reflects green.', 'Carotenoids are accessory pigments.', 'Overall: 6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂.'],
      questions: [
        { id: 'pig1', q: 'Where in the chloroplast do the light-dependent reactions take place?', opts: ['Thylakoid membranes', 'Stroma', 'Outer membrane', 'Cell wall'], why: 'Chlorophyll and the electron transport chain sit in the thylakoid membranes. The stroma is where the Calvin cycle runs.' },
        { id: 'pig2', q: 'Why do most leaves look green?', opts: ['Chlorophyll reflects green light', 'Chlorophyll absorbs green light most strongly', 'Leaves produce their own green light', 'Water in the leaf is green'], why: 'Chlorophyll absorbs red and blue light best, so the green light is reflected back to our eyes.' },
        { id: 'pig3', q: 'Which equation summarises photosynthesis?', opts: ['6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂', 'C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + energy', '6CO₂ + 6O₂ → C₆H₁₂O₆ + 6H₂O', '6H₂O + 6O₂ + light → C₆H₁₂O₆ + 6CO₂'], why: 'Photosynthesis takes in CO₂ and water and releases glucose and oxygen. The second option is cellular respiration.' },
        { id: 'pig4', q: 'What is the main role of carotenoids?', opts: ['Capture extra light wavelengths and protect chlorophyll', 'Store glucose', 'Release oxygen', 'Fix CO₂ directly'], why: 'Carotenoids are accessory pigments: they widen the range of light the leaf can use and shield chlorophyll.' }
      ] },
    { id: 'lite', name: 'Light reactions', kw: 'light dependent reactions',
      lesson: 'In the thylakoid membranes, light excites electrons in photosystem II. Water is split (photolysis), releasing O₂, H⁺ and replacement electrons. The electrons move along an electron transport chain, pumping H⁺ into the thylakoid space. H⁺ flowing back through ATP synthase makes ATP. At photosystem I the electrons are re-energised and used to make NADPH.',
      points: ['Water is split, and the O₂ released comes from water.', 'Products: ATP, NADPH and O₂.', 'ATP synthase makes ATP using the H⁺ gradient.', 'Needs light directly.'],
      questions: [
        { id: 'lite1', q: 'Where does the oxygen released in photosynthesis come from?', opts: ['Water (H₂O)', 'Carbon dioxide (CO₂)', 'Glucose', 'Chlorophyll'], why: 'Photolysis splits water in photosystem II, releasing O₂. The carbon from CO₂ ends up in glucose.' },
        { id: 'lite2', q: 'Which products of the light reactions are used by the Calvin cycle?', opts: ['ATP and NADPH', 'Glucose and O₂', 'CO₂ and water', 'ADP and NADP⁺'], why: 'ATP and NADPH carry the energy and reducing power the Calvin cycle needs. ADP and NADP⁺ go back to the light reactions.' },
        { id: 'lite3', q: 'Which enzyme makes ATP in the thylakoid membrane?', opts: ['ATP synthase', 'Rubisco', 'Amylase', 'DNA polymerase'], why: 'ATP synthase uses the flow of H⁺ down its gradient to join ADP and phosphate. Rubisco belongs to the Calvin cycle.' },
        { id: 'lite4', q: 'What happens to light energy absorbed by photosystem II?', opts: ['It raises electrons to a higher energy level', 'It is converted only into heat', 'It directly builds glucose', 'It splits CO₂'], why: 'Absorbed light excites electrons, which then travel down the electron transport chain.' }
      ] },
    { id: 'calv', name: 'Calvin cycle', kw: 'Calvin cycle',
      lesson: 'The Calvin cycle runs in the stroma. It does not use light directly, but it depends on ATP and NADPH from the light reactions. Step 1, carbon fixation: rubisco attaches CO₂ to RuBP, giving two 3-PGA molecules. Step 2, reduction: ATP and NADPH turn 3-PGA into G3P. Step 3, regeneration: some G3P is rebuilt into RuBP so the cycle continues. G3P leaves to make glucose.',
      points: ['Location: stroma.', 'Rubisco fixes CO₂ onto RuBP.', 'ATP and NADPH power the reduction of 3-PGA to G3P.', 'Six CO₂ must be fixed to build one glucose (6 carbons).'],
      questions: [
        { id: 'calv1', q: 'Where does the Calvin cycle take place?', opts: ['Stroma', 'Thylakoid space', 'Mitochondrial matrix', 'Cytoplasm'], why: "The Calvin cycle's enzymes float in the stroma, the fluid surrounding the thylakoids." },
        { id: 'calv2', q: 'Which enzyme fixes CO₂ in the Calvin cycle?', opts: ['Rubisco', 'ATP synthase', 'Catalase', 'Helicase'], why: 'Rubisco attaches CO₂ to RuBP: this is the carbon fixation step.' },
        { id: 'calv3', q: 'What do ATP and NADPH do in the Calvin cycle?', opts: ['Supply energy and reducing power to turn 3-PGA into G3P', 'Split water', 'Absorb light', 'Build chlorophyll'], why: 'The reduction phase needs both energy (ATP) and electrons (NADPH) to make G3P.' },
        { id: 'calv4', q: 'How many CO₂ molecules must be fixed to make one glucose molecule?', opts: ['6', '3', '12', '1'], why: 'Glucose has six carbons, and each CO₂ brings one carbon, so six CO₂ are needed.' }
      ] },
    { id: 'lim', name: 'Limiting factors', kw: 'limiting factors of photosynthesis',
      lesson: 'The rate of photosynthesis is held back by whichever factor is in shortest supply: light intensity, CO₂ concentration or temperature. Raising a limiting factor increases the rate until another factor becomes limiting, so the graph levels off. Enzymes such as rubisco work faster as temperature rises, up to an optimum; beyond it they denature and the rate drops sharply. In hot, dry weather stomata close, which cuts CO₂ intake.',
      points: ['The limiting factor is the one in shortest supply.', 'A plateau on a graph means another factor is now limiting.', 'Very high temperatures denature enzymes.', 'Closed stomata reduce CO₂ entering the leaf.'],
      questions: [
        { id: 'lim1', q: 'A graph of photosynthesis rate against light intensity levels off. What is the most likely reason?', opts: ['Another factor, such as CO₂ or temperature, is now limiting', 'The plant has started only respiring', 'Light is harmful at every intensity', 'Chlorophyll has turned into glucose'], why: 'Once light is no longer the scarcest resource, adding more of it has no effect.' },
        { id: 'lim2', q: 'Why does the rate fall sharply at very high temperatures?', opts: ['Enzymes such as rubisco denature', 'Too much CO₂ is available', 'Light intensity automatically decreases', 'Chlorophyll turns into water'], why: 'Above the optimum temperature, enzyme shape is destroyed so the reactions slow or stop.' },
        { id: 'lim3', q: 'On a hot, dry day the stomata close. What is the effect on photosynthesis?', opts: ['Less CO₂ enters, so the rate falls', 'The rate rises because less water is lost', 'No effect, because only light matters', 'More O₂ enters the leaf'], why: 'Stomata are the gateway for CO₂. Closing them starves the Calvin cycle.' },
        { id: 'lim4', q: 'What is a limiting factor?', opts: ['The factor in shortest supply that holds back the rate', 'The factor present in the greatest amount', 'Any product of the reaction', 'Only light intensity'], why: 'The process can only run as fast as its scarcest requirement allows.' }
      ] }
  ]
},
/* ---------------------------------------------------------- PHYSICS */
{
  id: 'phy', title: "Newton's laws of motion", area: 'Physics', kw: "Newton's laws of motion",
  blurb: 'Force, mass, acceleration and action–reaction.',
  bands: ['secondary', 'higher'],
  resources: [
    { type: 'Course', title: 'Khan Academy: Physics', url: 'https://www.khanacademy.org/science/physics', note: 'Force and motion lessons with practice.' },
    { type: 'Tool',   title: 'PhET Interactive Simulations', url: 'https://phet.colorado.edu/', note: 'Free simulations: try forces and friction yourself.' },
    { type: 'Read',   title: 'The Physics Classroom', url: 'https://www.physicsclassroom.com/', note: 'Clear tutorials with worked examples.' }
  ],
  topics: [
    { id: 'n1', name: 'First law: inertia', kw: "Newton's first law inertia",
      lesson: "Newton's first law says an object stays at rest, or keeps moving in a straight line at constant velocity, unless a net (unbalanced) force acts on it. This tendency to resist changes in motion is called inertia, and the more mass an object has, the more inertia it has. If the net force is zero, the velocity does not change.",
      points: ['No net force means no change in velocity.', 'Inertia is resistance to changes in motion.', 'More mass means more inertia.', 'Constant velocity can include being at rest.'],
      questions: [
        { id: 'n1a', q: 'A puck slides on perfectly frictionless ice and no force acts on it. What happens?', opts: ['It keeps moving at constant velocity', 'It slowly stops', 'It speeds up', 'It turns in a circle'], why: 'With no net force, velocity stays the same. This is the first law.' },
        { id: 'n1b', q: 'Which object has the greatest inertia?', opts: ['A 50 kg sack', 'A 5 kg bag', 'A 1 kg book', 'A 0.5 kg ball'], why: 'Inertia depends on mass, and the 50 kg sack has the most.' },
        { id: 'n1c', q: 'Passengers lurch forward when a bus brakes suddenly. Why?', opts: ['Their bodies tend to keep moving at the same velocity', 'A force pushes them forward', 'Gravity suddenly increases', 'The bus pulls them forward'], why: 'The bus slows down but the passengers, due to inertia, tend to keep moving forward.' },
        { id: 'n1d', q: 'What does a net force of zero on an object tell you?', opts: ['Its velocity is constant (possibly zero)', 'It must be at rest', 'It must be accelerating', 'No forces act on it at all'], why: 'Forces can act, but if they balance, velocity does not change.' }
      ] },
    { id: 'n2', name: 'Second law: F = ma', kw: "Newton's second law F=ma",
      lesson: "Newton's second law links force, mass and acceleration: F = ma. A bigger net force gives a bigger acceleration, and a bigger mass gives a smaller acceleration for the same force. Force is measured in newtons (N), where 1 N = 1 kg·m/s².",
      points: ['F = ma, a = F/m, m = F/a.', 'Double the force and the acceleration doubles.', 'Double the mass and the acceleration halves.', 'Unit of force: newton (kg·m/s²).'],
      questions: [
        { id: 'n2a', q: 'What net force gives a 5 kg object an acceleration of 2 m/s²?', opts: ['10 N', '2.5 N', '7 N', '0.4 N'], why: 'F = ma = 5 × 2 = 10 N.' },
        { id: 'n2b', q: 'A 20 N net force acts on a 4 kg mass. What is its acceleration?', opts: ['5 m/s²', '80 m/s²', '0.2 m/s²', '16 m/s²'], why: 'a = F/m = 20 ÷ 4 = 5 m/s².' },
        { id: 'n2c', q: 'The same force is applied to an object with double the mass. What happens to the acceleration?', opts: ['It is halved', 'It is doubled', 'It stays the same', 'It is quadrupled'], why: 'a = F/m, so doubling m halves a.' },
        { id: 'n2d', q: 'Which is the SI unit of force?', opts: ['Newton (N)', 'Joule (J)', 'Watt (W)', 'Pascal (Pa)'], why: 'The newton is defined as 1 kg·m/s².' }
      ] },
    { id: 'n3', name: 'Third law: action and reaction', kw: "Newton's third law action reaction",
      lesson: "Newton's third law says that when object A pushes on object B, object B pushes back on A with a force of equal size and opposite direction. These two forces act on different objects, so they never cancel each other out. Rockets, swimming and walking all depend on this law.",
      points: ['Forces always come in pairs.', 'Equal in size, opposite in direction.', 'The pair acts on different objects.', 'Example: rocket exhaust pushes down, the gas pushes the rocket up.'],
      questions: [
        { id: 'n3a', q: 'You push a wall with 50 N. What does the wall do?', opts: ['Pushes back on you with 50 N', 'Pushes back with less than 50 N', 'Pushes back with more than 50 N', 'Exerts no force'], why: 'The reaction force is equal in size and opposite in direction.' },
        { id: 'n3b', q: 'Action and reaction forces act on...', opts: ['Different objects', 'The same object', 'Only moving objects', 'Only objects in space'], why: 'Because they act on different objects, they do not cancel.' },
        { id: 'n3c', q: 'Why does a rocket move upward?', opts: ['The exhaust gas it pushes down pushes the rocket up', 'It pushes against the air', 'Gravity pulls it up', 'The launch pad pulls it up'], why: 'The rocket pushes gas down, and the gas pushes the rocket up with an equal force.' },
        { id: 'n3d', q: 'A book rests on a table and the Earth pulls it down. What is the reaction to that pull?', opts: ['The book pulls the Earth up', 'The table pushes the book up', 'The table pulls the Earth down', 'Air pushes the book up'], why: "The pair must be the same type of force on the other object: the book's pull on the Earth. The table's push balances the weight but is not its reaction pair." }
      ] },
    { id: 'wf', name: 'Weight, mass & friction', kw: 'weight mass friction',
      lesson: 'Mass is the amount of matter in an object and is measured in kilograms; it does not change from place to place. Weight is the force of gravity on that mass: W = mg, with g ≈ 9.8 N/kg on Earth. Friction is a force that opposes the motion (or attempted motion) between two surfaces in contact. If an object moves at constant speed, the push and the friction are balanced.',
      points: ['W = mg, g ≈ 9.8 m/s² on Earth.', 'Mass stays the same on the Moon; weight is smaller.', 'Friction opposes motion.', 'Constant speed means the net force is zero.'],
      questions: [
        { id: 'wf1', q: 'What is the weight of a 10 kg object on Earth (g = 9.8 m/s²)?', opts: ['98 N', '10 N', '9.8 N', '980 N'], why: 'W = mg = 10 × 9.8 = 98 N.' },
        { id: 'wf2', q: 'An astronaut goes from Earth to the Moon. What happens?', opts: ['Mass stays the same but weight decreases', 'Both mass and weight decrease', 'Mass increases and weight decreases', 'Weight stays the same and mass decreases'], why: "Mass is the amount of matter, so it doesn't change. The Moon's gravity is weaker, so the weight is smaller." },
        { id: 'wf3', q: 'In which direction does friction act on a sliding box?', opts: ['Opposite to its motion', 'In the same direction as its motion', 'Straight upward', 'It does not act on moving objects'], why: 'Friction opposes the relative motion of the surfaces.' },
        { id: 'wf4', q: 'You push a box across a rough floor at a constant speed. What is true?', opts: ['Your push equals the friction force', 'Your push is larger than the friction force', 'Friction is zero', 'Your push is zero'], why: 'Constant speed means zero net force, so the push and friction balance.' }
      ] }
  ]
},
/* ---------------------------------------------------------- PYTHON */
{
  id: 'py', title: 'Python basics', area: 'Computer Science', kw: 'Python programming',
  blurb: 'Types, loops, collections and functions.',
  bands: ['secondary', 'higher'],
  resources: [
    { type: 'Course', title: 'The Python Tutorial (official)', url: 'https://docs.python.org/3/tutorial/', note: 'The official, beginner-friendly guide.' },
    { type: 'Read',   title: 'W3Schools Python', url: 'https://www.w3schools.com/python/', note: 'Short lessons with "try it yourself" examples.' },
    { type: 'Tool',   title: 'Python Tutor visualizer', url: 'https://pythontutor.com/', note: 'Watch your code run step by step.' },
    { type: 'Read',   title: 'Real Python', url: 'https://realpython.com/', note: 'In-depth tutorials once you know the basics.' }
  ],
  topics: [
    { id: 'var', name: 'Variables & data types', kw: 'variables data types',
      lesson: 'A variable is a name that refers to a value. Python figures out the type itself. The common types are int, float, str and bool, and type() tells you which one a value has. Division with / always gives a float, // gives the floor of the division and % gives the remainder. Adding two strings joins them; it doesn\'t add numbers.',
      points: ['int, float, str and bool are the core types.', '/ gives a float, // floors, % is the remainder.', '"5" + "3" gives "53" (string concatenation).', 'int("12") converts text to a number.'],
      questions: [
        { id: 'var1', q: 'What type is the value 3.0 in Python?', opts: ['float', 'int', 'str', 'bool'], why: 'A number with a decimal point is a float, even if the decimal part is zero.' },
        { id: 'var2', q: 'What is the value of 7 // 2 ?', opts: ['3', '3.5', '4', '1'], why: '// is floor division: 7 / 2 = 3.5, floored to 3.' },
        { id: 'var3', q: 'What does this print?', code: 'print("5" + "3")', opts: ['53', '8', 'Error', '"8"'], why: 'Both values are strings, so + joins them into "53".' },
        { id: 'var4', q: 'What is int("12") + 3 ?', opts: ['15', '123', '"123"', 'TypeError'], why: 'int("12") turns the text into the number 12, and 12 + 3 = 15.' }
      ] },
    { id: 'flow', name: 'Conditionals & loops', kw: 'if else for while loops',
      lesson: 'if / elif / else choose which block runs, and only the first true branch executes. A for loop walks through a sequence; range(n) produces 0 to n − 1, and range(a, b) produces a to b − 1. A while loop repeats while its condition is true. break leaves the loop immediately; continue skips to the next round.',
      points: ['Only the first true if/elif branch runs.', 'range(4) → 0, 1, 2, 3', 'range(1, 4) → 1, 2, 3', 'break exits the loop; continue skips an iteration.'],
      questions: [
        { id: 'flow1', q: 'How many times does this loop run?', code: 'for i in range(4):\n    print(i)', opts: ['4', '3', '5', '0'], why: 'range(4) gives 0, 1, 2, 3: four values, so four iterations.' },
        { id: 'flow2', q: 'What does this print?', code: 'for i in range(1, 4):\n    print(i)', opts: ['1, 2, 3', '0, 1, 2, 3', '1, 2, 3, 4', '0, 1, 2'], why: 'range(1, 4) starts at 1 and stops before 4.' },
        { id: 'flow3', q: 'What does this print?', code: 'x = 10\nif x > 5:\n    print("A")\nelif x > 8:\n    print("B")\nelse:\n    print("C")', opts: ['A', 'B', 'A and B', 'C'], why: 'x > 5 is true, so "A" prints and the other branches are skipped.' },
        { id: 'flow4', q: 'What does the break statement do?', opts: ['Exits the loop immediately', 'Skips to the next iteration', 'Ends the whole program', 'Restarts the loop'], why: 'break leaves the loop. Skipping to the next iteration is continue.' }
      ] },
    { id: 'col', name: 'Lists & dictionaries', kw: 'lists dictionaries',
      lesson: 'A list is an ordered, changeable collection indexed from 0; negative indexes count from the end, so nums[-1] is the last item. append() adds an item to the end and slices like nums[1:] copy part of the list. A dictionary stores key–value pairs; you read a value with d[key], and a missing key raises KeyError (d.get(key) returns None instead).',
      points: ['Indexes start at 0; −1 is the last item.', 'list.append(x) adds to the end.', 'Slice nums[1:] skips the first item.', 'dict[key] gives the value; keys are unique.'],
      questions: [
        { id: 'col1', q: 'What does this print?', code: 'nums = [10, 20, 30]\nprint(nums[-1])', opts: ['30', '10', '20', 'IndexError'], why: 'Index −1 is the last element.' },
        { id: 'col2', q: 'What does this print?', code: 'nums = [1, 2]\nnums.append(3)\nprint(nums)', opts: ['[1, 2, 3]', '[3, 1, 2]', '[1, 2]', '[1, 2, [3]]'], why: 'append() adds the item to the end of the list.' },
        { id: 'col3', q: 'What does this print?', code: 'd = {"a": 1, "b": 2}\nprint(d["b"])', opts: ['2', '1', '"b"', 'KeyError'], why: 'd["b"] looks up the value stored under the key "b".' },
        { id: 'col4', q: 'What does this print?', code: 'print(len([1, 2, 3][1:]))', opts: ['2', '1', '3', '0'], why: '[1, 2, 3][1:] is [2, 3], which has length 2.' }
      ] },
    { id: 'fn', name: 'Functions', kw: 'functions def return',
      lesson: 'Define a function with def, give it parameters and use return to send a value back. A function without a return statement gives back None. Parameters can have default values. Variables created inside a function are local: they don\'t exist outside it.',
      points: ['def name(params): defines a function.', 'No return means the result is None.', 'Default values: def add(a, b=2)', 'Local variables vanish when the function ends.'],
      questions: [
        { id: 'fn1', q: 'What does a function return if it has no return statement?', opts: ['None', '0', 'An empty string', 'False'], why: 'Python returns None when a function finishes without return.' },
        { id: 'fn2', q: 'What does this print?', code: 'def add(a, b=2):\n    return a + b\nprint(add(3))', opts: ['5', '3', 'Error', '2'], why: 'b defaults to 2, so add(3) is 3 + 2 = 5.' },
        { id: 'fn3', q: 'Which keyword defines a function in Python?', opts: ['def', 'func', 'function', 'define'], why: 'Python uses def.' },
        { id: 'fn4', q: 'What happens when this code runs?', code: 'def f():\n    x = 5\nf()\nprint(x)', opts: ['NameError', 'It prints 5', 'It prints None', 'It prints 0'], why: "x is local to f. Outside the function the name x doesn't exist." }
      ] }
  ]
}
];

/* Study links for one topic. These are search/landing links, so they never go stale. */
function topicResources(subject, topic, grade) {
  const enc = encodeURIComponent;
  const term = topic.kw || topic.name;
  const level = grade ? ' class ' + grade : '';
  return [
    { type: 'Watch',    title: 'Video lessons',    url: 'https://www.youtube.com/results?search_query=' + enc(term + level + ' explained') },
    { type: 'Read',     title: 'Read the theory',  url: 'https://en.wikipedia.org/w/index.php?search=' + enc(term) },
    { type: 'Practice', title: 'Practice questions', url: 'https://www.khanacademy.org/search?page_search_query=' + enc(term) }
  ];
}

module.exports = { BANDS, SUBJECTS, bandOf, topicResources };
