type Difficulty = 'easy' | 'medium' | 'hard';

export interface SeedQuestion {
  id: string;
  type: 'mcq';
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  topic: string;
  difficulty: Difficulty;
  points: number;
}

export interface SeedTest {
  category: string;
  title: string;
  description: string;
  duration: number;
  questions: SeedQuestion[];
  totalPoints: number;
}

function pts(difficulty: Difficulty): number {
  if (difficulty === 'hard') return 15;
  if (difficulty === 'medium') return 12;
  return 10;
}

function q(
  prefix: string,
  num: number,
  question: string,
  options: [string, string, string, string],
  correctAnswer: string,
  explanation: string,
  topic: string,
  difficulty: Difficulty = 'easy'
): SeedQuestion {
  return {
    id: `${prefix}-${num}`,
    type: 'mcq',
    question,
    options: [...options],
    correctAnswer,
    explanation,
    topic,
    difficulty,
    points: pts(difficulty),
  };
}

function buildTest(
  category: string,
  title: string,
  description: string,
  duration: number,
  prefix: string,
  items: Array<{
    question: string;
    options: [string, string, string, string];
    correctAnswer: string;
    explanation: string;
    topic: string;
    difficulty?: Difficulty;
  }>
): SeedTest {
  const questions = items.map((item, i) =>
    q(prefix, i + 1, item.question, item.options, item.correctAnswer, item.explanation, item.topic, item.difficulty ?? 'easy')
  );
  return {
    category,
    title,
    description,
    duration,
    questions,
    totalPoints: questions.reduce((sum, item) => sum + item.points, 0),
  };
}

export const ASSESSMENT_SEED_TESTS: SeedTest[] = [
  buildTest('dsa', 'DSA Fundamentals', 'Test your data structures and algorithms knowledge', 40, 'dsa', [
    { question: 'What is the time complexity of binary search?', options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'], correctAnswer: 'O(log n)', explanation: 'Binary search halves the search space each iteration.', topic: 'Algorithms' },
    { question: 'Which data structure uses LIFO principle?', options: ['Queue', 'Stack', 'Tree', 'Graph'], correctAnswer: 'Stack', explanation: 'Stack follows Last In First Out.', topic: 'Data Structures' },
    { question: 'What is the worst-case time complexity of Quick Sort?', options: ['O(n log n)', 'O(n²)', 'O(n)', 'O(log n)'], correctAnswer: 'O(n²)', explanation: 'Quick Sort degrades to O(n²) with poor pivot selection.', topic: 'Sorting', difficulty: 'medium' },
    { question: 'Which traversal visits root, left, then right?', options: ['Inorder', 'Preorder', 'Postorder', 'Level order'], correctAnswer: 'Preorder', explanation: 'Preorder: root → left → right.', topic: 'Trees' },
    { question: 'What is the time complexity of accessing an element in an array by index?', options: ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'], correctAnswer: 'O(1)', explanation: 'Arrays support constant-time random access.', topic: 'Arrays' },
    { question: 'Which structure is best for BFS on a graph?', options: ['Stack', 'Queue', 'Heap', 'Set only'], correctAnswer: 'Queue', explanation: 'BFS uses a queue to process nodes level by level.', topic: 'Graphs', difficulty: 'medium' },
    { question: 'What is the height of a complete binary tree with n nodes (approx)?', options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'], correctAnswer: 'O(log n)', explanation: 'A balanced binary tree has height logarithmic in n.', topic: 'Trees', difficulty: 'medium' },
    { question: 'Which sorting algorithm is stable by default?', options: ['Quick Sort', 'Heap Sort', 'Merge Sort', 'Selection Sort'], correctAnswer: 'Merge Sort', explanation: 'Merge Sort preserves relative order of equal elements.', topic: 'Sorting', difficulty: 'medium' },
    { question: 'In a min-heap, the smallest element is at:', options: ['Leaf node', 'Root', 'Last level', 'Random position'], correctAnswer: 'Root', explanation: 'Min-heap property keeps minimum at the root.', topic: 'Heaps' },
    { question: 'What does DFS primarily use?', options: ['Queue', 'Stack', 'Priority queue', 'Deque only'], correctAnswer: 'Stack', explanation: 'DFS explores depth-first using stack (explicit or recursion).', topic: 'Graphs' },
    { question: 'Time complexity of inserting at end of dynamic array (amortized)?', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], correctAnswer: 'O(1)', explanation: 'Amortized O(1) due to occasional resizing.', topic: 'Arrays', difficulty: 'medium' },
    { question: 'Which is NOT a linear data structure?', options: ['Array', 'Linked List', 'Tree', 'Queue'], correctAnswer: 'Tree', explanation: 'Trees are hierarchical, not linear.', topic: 'Data Structures' },
    { question: 'Hash table average-case lookup complexity?', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], correctAnswer: 'O(1)', explanation: 'With a good hash function, average lookup is O(1).', topic: 'Hashing', difficulty: 'medium' },
    { question: 'Which algorithm finds shortest path in unweighted graph?', options: ['Dijkstra', 'BFS', 'Bellman-Ford', 'Floyd-Warshall'], correctAnswer: 'BFS', explanation: 'BFS finds shortest paths when all edges have equal weight.', topic: 'Graphs', difficulty: 'hard' },
    { question: 'What is the space complexity of merge sort?', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], correctAnswer: 'O(n)', explanation: 'Merge sort needs O(n) auxiliary space for merging.', topic: 'Sorting', difficulty: 'hard' },
  ]),
  buildTest('java', 'Java Core Concepts', 'Test your Java programming fundamentals', 40, 'java', [
    { question: 'Which keyword is used for inheritance in Java?', options: ['implements', 'extends', 'inherits', 'super'], correctAnswer: 'extends', explanation: 'Java uses extends for class inheritance.', topic: 'OOP' },
    { question: 'What is the default value of an int in Java?', options: ['null', '0', 'undefined', '-1'], correctAnswer: '0', explanation: 'Primitive int defaults to 0.', topic: 'Primitives' },
    { question: 'Which collection does not allow duplicate elements?', options: ['List', 'Set', 'Queue', 'ArrayList'], correctAnswer: 'Set', explanation: 'Set interface models mathematical sets without duplicates.', topic: 'Collections' },
    { question: 'What is the size of char in Java?', options: ['1 byte', '2 bytes', '4 bytes', '8 bytes'], correctAnswer: '2 bytes', explanation: 'Java char is 16-bit UTF-16.', topic: 'Primitives', difficulty: 'medium' },
    { question: 'Which method is the entry point of a Java application?', options: ['start()', 'main()', 'run()', 'init()'], correctAnswer: 'main()', explanation: 'JVM looks for public static void main(String[] args).', topic: 'Basics' },
    { question: 'Which keyword prevents method overriding?', options: ['static', 'final', 'abstract', 'private'], correctAnswer: 'final', explanation: 'final methods cannot be overridden in subclasses.', topic: 'OOP', difficulty: 'medium' },
    { question: 'What does "implements" do in Java?', options: ['Inherits class', 'Implements interface', 'Creates package', 'Imports library'], correctAnswer: 'Implements interface', explanation: 'A class implements an interface contract.', topic: 'OOP' },
    { question: 'Which is NOT a Java access modifier?', options: ['public', 'protected', 'internal', 'private'], correctAnswer: 'internal', explanation: 'Java has public, protected, default, and private.', topic: 'OOP' },
    { question: 'Which exception is unchecked?', options: ['IOException', 'SQLException', 'NullPointerException', 'ClassNotFoundException'], correctAnswer: 'NullPointerException', explanation: 'RuntimeException and subclasses are unchecked.', topic: 'Exceptions', difficulty: 'medium' },
    { question: 'String objects in Java are:', options: ['Mutable', 'Immutable', 'Primitive', 'Serializable only'], correctAnswer: 'Immutable', explanation: 'String content cannot change after creation.', topic: 'Strings' },
    { question: 'Which loop is guaranteed to run at least once?', options: ['for', 'while', 'do-while', 'enhanced for'], correctAnswer: 'do-while', explanation: 'do-while checks condition after the body.', topic: 'Control Flow' },
    { question: 'What is autoboxing?', options: ['Primitive to wrapper', 'Wrapper to primitive', 'Class to interface', 'Array to list'], correctAnswer: 'Primitive to wrapper', explanation: 'Autoboxing converts int to Integer automatically.', topic: 'Primitives', difficulty: 'medium' },
    { question: 'Which collection is synchronized by default?', options: ['ArrayList', 'HashMap', 'Vector', 'HashSet'], correctAnswer: 'Vector', explanation: 'Vector methods are synchronized for thread safety.', topic: 'Collections', difficulty: 'hard' },
    { question: 'What does the "super" keyword refer to?', options: ['Current class', 'Parent class', 'Child class', 'Interface'], correctAnswer: 'Parent class', explanation: 'super accesses parent class members.', topic: 'OOP' },
    { question: 'Which JVM memory holds object instances?', options: ['Stack', 'Heap', 'Method area only', 'Registers'], correctAnswer: 'Heap', explanation: 'Objects are allocated on the heap.', topic: 'JVM', difficulty: 'hard' },
  ]),
  buildTest('python', 'Python Essentials', 'Test your Python programming skills', 40, 'py', [
    { question: 'Which of these is mutable in Python?', options: ['tuple', 'string', 'list', 'frozenset'], correctAnswer: 'list', explanation: 'Lists are mutable in Python.', topic: 'Data Types' },
    { question: 'What is the output type of type(3.14)?', options: ['int', 'float', 'double', 'decimal'], correctAnswer: 'float', explanation: 'Python uses float for decimal numbers.', topic: 'Data Types' },
    { question: 'Which keyword defines a function in Python?', options: ['func', 'def', 'function', 'fn'], correctAnswer: 'def', explanation: 'Functions are defined with def.', topic: 'Functions' },
    { question: 'What does len([1, 2, 3]) return?', options: ['2', '3', '4', 'Error'], correctAnswer: '3', explanation: 'len() returns the number of elements.', topic: 'Built-ins' },
    { question: 'Which creates an empty dictionary?', options: ['[]', '{}', '()', 'set()'], correctAnswer: '{}', explanation: 'Curly braces create a dict; use dict() for clarity.', topic: 'Data Types' },
    { question: 'What is list comprehension?', options: ['Loop in one line', 'File reading', 'Exception handling', 'Module import'], correctAnswer: 'Loop in one line', explanation: '[x for x in iterable] builds a list concisely.', topic: 'Comprehensions', difficulty: 'medium' },
    { question: 'Which is used to handle exceptions?', options: ['try/except', 'catch', 'handle', 'error'], correctAnswer: 'try/except', explanation: 'Python uses try/except/finally.', topic: 'Exceptions' },
    { question: 'What does "import numpy as np" do?', options: ['Installs numpy', 'Imports with alias', 'Deletes numpy', 'Compiles numpy'], correctAnswer: 'Imports with alias', explanation: 'as np gives a shorter reference name.', topic: 'Modules' },
    { question: 'Which method adds item to end of list?', options: ['add()', 'append()', 'push()', 'insert()'], correctAnswer: 'append()', explanation: 'list.append(x) adds x to the end.', topic: 'Lists' },
    { question: 'What is None in Python?', options: ['Zero', 'Null singleton', 'Empty string', 'False'], correctAnswer: 'Null singleton', explanation: 'None represents absence of value.', topic: 'Data Types' },
    { question: 'Which operator is floor division?', options: ['/', '//', '%', '**'], correctAnswer: '//', explanation: '// divides and floors the result.', topic: 'Operators', difficulty: 'medium' },
    { question: 'What does *args allow in a function?', options: ['Keyword args', 'Variable positional args', 'Default values', 'Global vars'], correctAnswer: 'Variable positional args', explanation: '*args collects extra positional arguments.', topic: 'Functions', difficulty: 'medium' },
    { question: 'Which is a valid way to open a file for reading?', options: ['open("f.txt", "w")', 'open("f.txt", "r")', 'read("f.txt")', 'file.open()'], correctAnswer: 'open("f.txt", "r")', explanation: 'Mode "r" opens for reading.', topic: 'File I/O' },
    { question: 'What is a Python decorator?', options: ['Comment syntax', 'Function wrapping another', 'Data class', 'Import hook'], correctAnswer: 'Function wrapping another', explanation: 'Decorators modify or wrap callable behavior.', topic: 'Advanced', difficulty: 'hard' },
    { question: 'Which data structure is ordered and immutable?', options: ['list', 'set', 'tuple', 'dict'], correctAnswer: 'tuple', explanation: 'Tuples maintain order and cannot be changed.', topic: 'Data Types', difficulty: 'hard' },
  ]),
  buildTest('sql', 'SQL Queries', 'Test your SQL knowledge', 35, 'sql', [
    { question: 'Which clause filters groups in SQL?', options: ['WHERE', 'HAVING', 'GROUP BY', 'ORDER BY'], correctAnswer: 'HAVING', explanation: 'HAVING filters grouped results.', topic: 'Aggregation', difficulty: 'medium' },
    { question: 'Which command removes all rows but keeps table structure?', options: ['DROP', 'DELETE', 'TRUNCATE', 'REMOVE'], correctAnswer: 'TRUNCATE', explanation: 'TRUNCATE removes rows; structure remains.', topic: 'DML' },
    { question: 'Which join returns only matching rows from both tables?', options: ['LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'CROSS JOIN'], correctAnswer: 'INNER JOIN', explanation: 'INNER JOIN returns intersection of keys.', topic: 'Joins' },
    { question: 'Which function counts non-null values?', options: ['SUM()', 'COUNT()', 'AVG()', 'MAX()'], correctAnswer: 'COUNT()', explanation: 'COUNT(column) counts non-null entries.', topic: 'Functions' },
    { question: 'PRIMARY KEY ensures:', options: ['Duplicates allowed', 'Unique + not null', 'Only not null', 'Foreign reference'], correctAnswer: 'Unique + not null', explanation: 'Primary keys uniquely identify rows.', topic: 'Constraints' },
    { question: 'Which sorts result descending?', options: ['ORDER BY col ASC', 'ORDER BY col DESC', 'SORT BY col', 'GROUP BY col'], correctAnswer: 'ORDER BY col DESC', explanation: 'DESC sorts from high to low.', topic: 'Sorting' },
    { question: 'What does DISTINCT do?', options: ['Sorts rows', 'Removes duplicates', 'Joins tables', 'Creates index'], correctAnswer: 'Removes duplicates', explanation: 'DISTINCT returns unique values.', topic: 'Queries' },
    { question: 'Which is a DDL command?', options: ['SELECT', 'INSERT', 'CREATE', 'UPDATE'], correctAnswer: 'CREATE', explanation: 'CREATE defines schema objects.', topic: 'DDL', difficulty: 'medium' },
    { question: 'FOREIGN KEY enforces:', options: ['Unique rows', 'Referential integrity', 'Auto increment', 'Encryption'], correctAnswer: 'Referential integrity', explanation: 'FK values must exist in parent table.', topic: 'Constraints', difficulty: 'medium' },
    { question: 'Which returns rows from left table even if no match?', options: ['INNER JOIN', 'LEFT JOIN', 'CROSS JOIN', 'SELF JOIN'], correctAnswer: 'LEFT JOIN', explanation: 'LEFT JOIN keeps all left rows.', topic: 'Joins', difficulty: 'medium' },
    { question: 'AVG() ignores:', options: ['NULL values', 'Zero values', 'Negative values', 'Duplicates'], correctAnswer: 'NULL values', explanation: 'Aggregate functions skip NULLs.', topic: 'Functions' },
    { question: 'Which indexes speed up lookups?', options: ['Views', 'Indexes', 'Triggers', 'Cursors'], correctAnswer: 'Indexes', explanation: 'Indexes improve search performance.', topic: 'Performance', difficulty: 'medium' },
    { question: 'Subquery in WHERE is called:', options: ['Nested query', 'Outer query', 'View', 'CTE only'], correctAnswer: 'Nested query', explanation: 'A query inside another query is a subquery.', topic: 'Subqueries', difficulty: 'hard' },
    { question: 'UNION vs UNION ALL difference?', options: ['UNION removes duplicates', 'UNION ALL removes duplicates', 'No difference', 'UNION is faster always'], correctAnswer: 'UNION removes duplicates', explanation: 'UNION deduplicates; UNION ALL keeps all rows.', topic: 'Set Operations', difficulty: 'hard' },
    { question: 'Which normal form removes partial dependency?', options: ['1NF', '2NF', '3NF', 'BCNF'], correctAnswer: '2NF', explanation: '2NF requires full functional dependency on key.', topic: 'Normalization', difficulty: 'hard' },
  ]),
  buildTest('javascript', 'JavaScript Fundamentals', 'Test your JavaScript skills', 40, 'js', [
    { question: 'What does === check in JavaScript?', options: ['Value only', 'Type only', 'Value and type', 'Reference'], correctAnswer: 'Value and type', explanation: 'Strict equality checks both value and type.', topic: 'Operators' },
    { question: 'Which declares a block-scoped variable?', options: ['var', 'let', 'function', 'label'], correctAnswer: 'let', explanation: 'let and const are block-scoped.', topic: 'Variables' },
    { question: 'typeof null returns:', options: ['"null"', '"object"', '"undefined"', '"number"'], correctAnswer: '"object"', explanation: 'Historic quirk: typeof null is "object".', topic: 'Types', difficulty: 'medium' },
    { question: 'Which method adds to end of array?', options: ['push()', 'pop()', 'shift()', 'unshift()'], correctAnswer: 'push()', explanation: 'push() appends to the end.', topic: 'Arrays' },
    { question: 'What is closure?', options: ['Function + lexical env', 'Loop type', 'DOM event', 'Promise state'], correctAnswer: 'Function + lexical env', explanation: 'Closures retain access to outer scope.', topic: 'Functions', difficulty: 'medium' },
    { question: 'Which is falsy in JavaScript?', options: ['[]', '{}', '0', '"0"'], correctAnswer: '0', explanation: '0, "", null, undefined, NaN, false are falsy.', topic: 'Types' },
    { question: 'async function always returns:', options: ['Object', 'Promise', 'String', 'Callback'], correctAnswer: 'Promise', explanation: 'Async functions wrap return values in a Promise.', topic: 'Async', difficulty: 'medium' },
    { question: 'Which parses JSON string to object?', options: ['JSON.stringify', 'JSON.parse', 'Object.parse', 'parseJSON'], correctAnswer: 'JSON.parse', explanation: 'JSON.parse deserializes JSON text.', topic: 'JSON' },
    { question: 'Event loop handles:', options: ['Compilation', 'Async callbacks', 'Memory GC only', 'CSS parsing'], correctAnswer: 'Async callbacks', explanation: 'The event loop schedules async work.', topic: 'Runtime', difficulty: 'hard' },
    { question: 'Spread operator syntax is:', options: ['...', '***', '>>', '&&'], correctAnswer: '...', explanation: '... spreads iterables into elements.', topic: 'ES6' },
    { question: 'map() on array returns:', options: ['Same array', 'New transformed array', 'Boolean', 'Index'], correctAnswer: 'New transformed array', explanation: 'map applies fn to each element.', topic: 'Arrays' },
    { question: 'const with object means:', options: ['Object frozen', 'Binding cannot be reassigned', 'Deep immutable', 'Read-only properties'], correctAnswer: 'Binding cannot be reassigned', explanation: 'const prevents rebinding; object may mutate.', topic: 'Variables', difficulty: 'medium' },
    { question: 'Which selects element by id?', options: ['document.query()', 'document.getElementById()', 'document.find()', 'window.select()'], correctAnswer: 'document.getElementById()', explanation: 'getElementById returns one element.', topic: 'DOM' },
    { question: 'Promise.all waits for:', options: ['First resolve', 'All resolve', 'Any reject only', 'Timeout'], correctAnswer: 'All resolve', explanation: 'Promise.all resolves when all promises resolve.', topic: 'Async', difficulty: 'hard' },
    { question: 'Hoisting applies to:', options: ['let/const only', 'var and function declarations', 'Classes only', 'Nothing'], correctAnswer: 'var and function declarations', explanation: 'var and function declarations are hoisted.', topic: 'Scope', difficulty: 'hard' },
  ]),
  buildTest('aptitude', 'Aptitude Test', 'Logical reasoning and aptitude', 40, 'apt', [
    { question: 'If 5 machines take 5 minutes to make 5 widgets, how long for 100 machines to make 100 widgets?', options: ['100 minutes', '5 minutes', '20 minutes', '1 minute'], correctAnswer: '5 minutes', explanation: 'Each machine makes 1 widget in 5 minutes.', topic: 'Logic', difficulty: 'medium' },
    { question: 'Find the next number: 2, 6, 12, 20, ?', options: ['28', '30', '32', '24'], correctAnswer: '30', explanation: 'Differences: +4, +6, +8, +10 → 20+10=30.', topic: 'Series', difficulty: 'medium' },
    { question: 'A is taller than B. C is shorter than B. Who is shortest?', options: ['A', 'B', 'C', 'Cannot say'], correctAnswer: 'C', explanation: 'A > B > C.', topic: 'Ordering' },
    { question: 'If all roses are flowers and some flowers fade, which is definitely true?', options: ['All roses fade', 'Some roses may fade', 'No roses fade', 'All flowers are roses'], correctAnswer: 'Some roses may fade', explanation: 'Roses are flowers; some flowers fade.', topic: 'Syllogism', difficulty: 'hard' },
    { question: 'Clock shows 3:15. Angle between hands?', options: ['0°', '7.5°', '15°', '30°'], correctAnswer: '7.5°', explanation: 'At 3:15, hour hand moves; angle ≈ 7.5°.', topic: 'Clocks', difficulty: 'hard' },
    { question: 'REASON is coded as SDDBTO. How is PLACE coded?', options: ['QMBDF', 'QMBCF', 'QMBCE', 'QMBDE'], correctAnswer: 'QMBCF', explanation: 'Each letter +1: P→Q, L→M, A→B, C→D, E→F.', topic: 'Coding', difficulty: 'medium' },
    { question: '5 people in a row. A sits left of B. C sits right of B. Who is in middle?', options: ['A', 'B', 'C', 'D'], correctAnswer: 'B', explanation: 'Order: A, B, C — B is middle.', topic: 'Seating' },
    { question: 'If 40% of a number is 80, the number is:', options: ['160', '200', '240', '320'], correctAnswer: '200', explanation: '0.4x = 80 → x = 200.', topic: 'Percentages' },
    { question: 'Which does not belong: Circle, Square, Triangle, Cube?', options: ['Circle', 'Square', 'Triangle', 'Cube'], correctAnswer: 'Cube', explanation: 'Cube is 3D; others are 2D shapes.', topic: 'Classification' },
    { question: 'Today is Monday. What day after 61 days?', options: ['Tuesday', 'Wednesday', 'Saturday', 'Sunday'], correctAnswer: 'Saturday', explanation: '61 mod 7 = 5 → Monday + 5 = Saturday.', topic: 'Calendar', difficulty: 'medium' },
    { question: 'A pipe fills tank in 6 hrs, another in 3 hrs. Together?', options: ['1 hr', '2 hrs', '3 hrs', '4 hrs'], correctAnswer: '2 hrs', explanation: '1/6 + 1/3 = 1/2 → 2 hours.', topic: 'Pipes', difficulty: 'medium' },
    { question: 'Statement: All dogs bark. Conclusion: Some animals bark.', options: ['True', 'False', 'Cannot say', 'Irrelevant'], correctAnswer: 'True', explanation: 'Dogs are animals that bark.', topic: 'Syllogism' },
    { question: 'Mirror image of "b" is:', options: ['b', 'd', 'p', 'q'], correctAnswer: 'd', explanation: 'Vertical mirror flips b to d.', topic: 'Non-verbal' },
    { question: 'Average of 10, 20, 30, 40, 50?', options: ['25', '30', '35', '40'], correctAnswer: '30', explanation: 'Sum 150 / 5 = 30.', topic: 'Averages' },
    { question: 'If EAST becomes WNRT, NORTH becomes?', options: ['MLQSG', 'MLQSH', 'MLPSG', 'MNQSG'], correctAnswer: 'MLQSG', explanation: 'Each letter -1 in alphabet.', topic: 'Coding', difficulty: 'hard' },
  ]),
  buildTest('verbal', 'Verbal Ability', 'Reading comprehension, grammar, and vocabulary', 40, 'verb', [
    { question: 'Choose the word closest in meaning to "Benevolent":', options: ['Cruel', 'Kind', 'Neutral', 'Strict'], correctAnswer: 'Kind', explanation: 'Benevolent means kind and generous.', topic: 'Vocabulary' },
    { question: 'Identify the grammatically correct sentence:', options: ["He don't know", "He doesn't knows", "He doesn't know", 'He not know'], correctAnswer: "He doesn't know", explanation: 'Third person singular uses "doesn\'t" + base verb.', topic: 'Grammar' },
    { question: 'Antonym of "Abundant":', options: ['Plentiful', 'Scarce', 'Ample', 'Rich'], correctAnswer: 'Scarce', explanation: 'Abundant means plentiful; scarce is opposite.', topic: 'Vocabulary' },
    { question: 'Correct plural of "analysis":', options: ['analysises', 'analyses', 'analysiss', 'analysis'], correctAnswer: 'analyses', explanation: 'Analysis → analyses (Greek plural).', topic: 'Grammar', difficulty: 'medium' },
    { question: '"She has been working here ___ 2020."', options: ['for', 'since', 'from', 'by'], correctAnswer: 'since', explanation: 'since + point in time.', topic: 'Grammar' },
    { question: 'One word for "a person who loves books":', options: ['Bibliophile', 'Philanthropist', 'Misanthrope', 'Audiophile'], correctAnswer: 'Bibliophile', explanation: 'Biblio- (books) + -phile (lover).', topic: 'Vocabulary', difficulty: 'medium' },
    { question: 'Choose correct article: "___ honest man"', options: ['a', 'an', 'the', 'no article'], correctAnswer: 'an', explanation: 'Honest starts with vowel sound.', topic: 'Grammar' },
    { question: 'Synonym of "Meticulous":', options: ['Careless', 'Thorough', 'Lazy', 'Rapid'], correctAnswer: 'Thorough', explanation: 'Meticulous means very careful and precise.', topic: 'Vocabulary' },
    { question: 'Identify the error: "Each of the boys have a pen."', options: ['Each', 'boys', 'have', 'pen'], correctAnswer: 'have', explanation: 'Each takes singular verb: has.', topic: 'Grammar', difficulty: 'medium' },
    { question: 'Meaning of "Break the ice":', options: ['Start conversation', 'Destroy something', 'Cool down', 'Win a game'], correctAnswer: 'Start conversation', explanation: 'Idiom: ease tension in social settings.', topic: 'Idioms' },
    { question: 'Passive voice of "She wrote a letter.":', options: ['A letter was written by her', 'A letter is written by her', 'She was written a letter', 'A letter wrote by her'], correctAnswer: 'A letter was written by her', explanation: 'Past simple passive: was/were + past participle.', topic: 'Grammar', difficulty: 'medium' },
    { question: 'Antonym of "Verbose":', options: ['Wordy', 'Concise', 'Lengthy', 'Talkative'], correctAnswer: 'Concise', explanation: 'Verbose means using too many words.', topic: 'Vocabulary' },
    { question: 'Correct spelling:', options: ['Accomodate', 'Accommodate', 'Acommodate', 'Accomadate'], correctAnswer: 'Accommodate', explanation: 'Double c and double m.', topic: 'Spelling' },
    { question: '"Neither Ram nor Shyam ___ present."', options: ['was', 'were', 'are', 'have been'], correctAnswer: 'was', explanation: 'Neither...nor with singular verb.', topic: 'Grammar', difficulty: 'hard' },
    { question: 'Meaning of "Ephemeral":', options: ['Lasting forever', 'Short-lived', 'Ancient', 'Heavy'], correctAnswer: 'Short-lived', explanation: 'Ephemeral means lasting a very short time.', topic: 'Vocabulary', difficulty: 'hard' },
  ]),
  buildTest('quantitative', 'Quantitative Aptitude', 'Numbers, percentages, and data interpretation', 40, 'quant', [
    { question: 'If a shirt priced at ₹800 is sold at 25% discount, what is the sale price?', options: ['₹600', '₹620', '₹640', '₹700'], correctAnswer: '₹600', explanation: '25% off ₹800 = ₹200 discount → ₹600.', topic: 'Percentages' },
    { question: 'A train 120m long passes a pole in 6 seconds. Speed in km/h?', options: ['60', '72', '80', '90'], correctAnswer: '72', explanation: 'Speed = 120/6 = 20 m/s = 72 km/h.', topic: 'Speed & Distance', difficulty: 'medium' },
    { question: 'Simple interest on ₹5000 at 10% for 2 years?', options: ['₹500', '₹1000', '₹1100', '₹1200'], correctAnswer: '₹1000', explanation: 'SI = PRT/100 = 5000×10×2/100 = 1000.', topic: 'Interest' },
    { question: 'Ratio 3:5, sum is 40. Larger part?', options: ['15', '20', '25', '30'], correctAnswer: '25', explanation: '5/8 × 40 = 25.', topic: 'Ratio' },
    { question: '15% of 240?', options: ['30', '36', '40', '48'], correctAnswer: '36', explanation: '0.15 × 240 = 36.', topic: 'Percentages' },
    { question: 'A buys at ₹200, sells at ₹250. Profit %?', options: ['20%', '25%', '30%', '50%'], correctAnswer: '25%', explanation: 'Profit 50 on 200 = 25%.', topic: 'Profit & Loss' },
    { question: 'LCM of 12 and 18?', options: ['24', '36', '48', '72'], correctAnswer: '36', explanation: 'LCM(12,18) = 36.', topic: 'Numbers' },
    { question: 'Average of first 10 natural numbers?', options: ['5', '5.5', '6', '10'], correctAnswer: '5.5', explanation: '(1+10)/2 = 5.5.', topic: 'Averages' },
    { question: 'Compound interest yearly: ₹1000 at 10% for 2 years (approx)?', options: ['₹200', '₹210', '₹220', '₹250'], correctAnswer: '₹210', explanation: '1000×1.1² = 1210 → CI = 210.', topic: 'Interest', difficulty: 'medium' },
    { question: 'If x² = 49, x = ?', options: ['7 only', '-7 only', '±7', '49'], correctAnswer: '±7', explanation: 'Both 7 and -7 satisfy x²=49.', topic: 'Algebra' },
    { question: 'A can do work in 10 days, B in 15 days. Together?', options: ['5 days', '6 days', '7 days', '8 days'], correctAnswer: '6 days', explanation: '1/10 + 1/15 = 1/6 → 6 days.', topic: 'Time & Work', difficulty: 'medium' },
    { question: 'Population 8000 increases 5%. New population?', options: ['8400', '8500', '8600', '8800'], correctAnswer: '8400', explanation: '8000 × 1.05 = 8400.', topic: 'Percentages' },
    { question: 'Area of circle radius 7 (π≈22/7)?', options: ['154', '144', '164', '174'], correctAnswer: '154', explanation: 'πr² = 22/7 × 49 = 154.', topic: 'Mensuration', difficulty: 'medium' },
    { question: 'Probability of head in fair coin?', options: ['1/4', '1/3', '1/2', '2/3'], correctAnswer: '1/2', explanation: 'Two equally likely outcomes.', topic: 'Probability' },
    { question: 'A number increased by 20% then decreased by 20%. Net change?', options: ['No change', '4% decrease', '4% increase', '10% decrease'], correctAnswer: '4% decrease', explanation: '1.2 × 0.8 = 0.96 → 4% loss.', topic: 'Percentages', difficulty: 'hard' },
  ]),
  buildTest('business', 'Business & Management Aptitude', 'Case-style reasoning, operations, and management fundamentals', 40, 'bus', [
    { question: 'Which metric best measures short-term liquidity?', options: ['Debt-to-equity', 'Current ratio', 'ROE', 'Gross margin'], correctAnswer: 'Current ratio', explanation: 'Current ratio = current assets / current liabilities.', topic: 'Finance Basics', difficulty: 'medium' },
    { question: 'In SWOT, "Threats" are:', options: ['Internal positive', 'Internal negative', 'External negative', 'External positive'], correctAnswer: 'External negative', explanation: 'Threats are external factors that may harm the organization.', topic: 'Strategy' },
    { question: 'Marketing mix 4Ps include:', options: ['Product, Price, Place, Promotion', 'People, Process, Product, Price', 'Plan, Price, Product, Profit', 'Place, People, Profit, Plan'], correctAnswer: 'Product, Price, Place, Promotion', explanation: 'Classic McCarthy 4Ps framework.', topic: 'Marketing' },
    { question: 'JIT inventory aims to:', options: ['Max stock', 'Minimize waste', 'Increase lead time', 'Raise holding cost'], correctAnswer: 'Minimize waste', explanation: 'Just-in-time reduces excess inventory.', topic: 'Operations', difficulty: 'medium' },
    { question: 'Span of control refers to:', options: ['Budget size', 'Subordinates per manager', 'Market share', 'Product lines'], correctAnswer: 'Subordinates per manager', explanation: 'How many employees report to one manager.', topic: 'Organisation' },
    { question: 'BCG matrix "Stars" have:', options: ['Low share, high growth', 'High share, high growth', 'High share, low growth', 'Low share, low growth'], correctAnswer: 'High share, high growth', explanation: 'Stars lead in growing markets.', topic: 'Strategy', difficulty: 'medium' },
    { question: 'Primary purpose of break-even analysis?', options: ['Tax planning', 'Find no-profit-no-loss volume', 'Set dividend', 'Hire staff'], correctAnswer: 'Find no-profit-no-loss volume', explanation: 'Where total revenue equals total cost.', topic: 'Finance Basics' },
    { question: 'Maslow\'s top need in hierarchy?', options: ['Safety', 'Esteem', 'Self-actualization', 'Belonging'], correctAnswer: 'Self-actualization', explanation: 'Highest level: realizing potential.', topic: 'HR', difficulty: 'medium' },
    { question: 'Stakeholder vs shareholder:', options: ['Same meaning', 'Stakeholder broader', 'Shareholder broader', 'Neither exists'], correctAnswer: 'Stakeholder broader', explanation: 'Stakeholders include employees, community, etc.', topic: 'Governance' },
    { question: 'ERP systems integrate:', options: ['Only HR', 'Only finance', 'Business processes', 'Only sales'], correctAnswer: 'Business processes', explanation: 'ERP connects departments on one platform.', topic: 'Operations' },
    { question: 'Blue ocean strategy focuses on:', options: ['Competing in crowded market', 'Creating uncontested space', 'Price war', 'Cost cutting only'], correctAnswer: 'Creating uncontested space', explanation: 'Innovate value instead of fighting rivals.', topic: 'Strategy', difficulty: 'hard' },
    { question: 'Working capital is:', options: ['Fixed assets', 'Current assets − current liabilities', 'Total debt', 'Retained earnings'], correctAnswer: 'Current assets − current liabilities', explanation: 'Short-term operational liquidity.', topic: 'Finance Basics', difficulty: 'medium' },
    { question: 'Kaizen means:', options: ['Big bang change', 'Continuous improvement', 'Downsizing', 'Outsourcing'], correctAnswer: 'Continuous improvement', explanation: 'Japanese philosophy of incremental gains.', topic: 'Operations' },
    { question: 'Delegation involves:', options: ['Avoiding responsibility', 'Assigning authority & task', 'Firing staff', 'Increasing hierarchy only'], correctAnswer: 'Assigning authority & task', explanation: 'Manager assigns work with appropriate authority.', topic: 'Management' },
    { question: 'PEST analysis examines:', options: ['Internal ops', 'Macro environment', 'Employee skills', 'Product features'], correctAnswer: 'Macro environment', explanation: 'Political, Economic, Social, Technological factors.', topic: 'Strategy', difficulty: 'hard' },
  ]),
  buildTest('finance', 'Finance & Accounts Basics', 'Accounting principles, GST, and financial statements', 40, 'fin', [
    { question: 'Which statement shows assets, liabilities, equity at a point in time?', options: ['Income statement', 'Cash flow', 'Balance sheet', 'Trial balance'], correctAnswer: 'Balance sheet', explanation: 'Balance sheet is a snapshot of financial position.', topic: 'Accounting' },
    { question: 'Debit the receiver, credit the giver applies to:', options: ['Real accounts', 'Personal accounts', 'Nominal accounts', 'All accounts'], correctAnswer: 'Personal accounts', explanation: 'Rule for personal accounts in traditional accounting.', topic: 'Accounting Rules', difficulty: 'medium' },
    { question: 'GST in India is:', options: ['Single state tax', 'Indirect tax on supply', 'Direct income tax', 'Import duty only'], correctAnswer: 'Indirect tax on supply', explanation: 'GST is a comprehensive indirect tax.', topic: 'GST' },
    { question: 'Depreciation represents:', options: ['Cash outflow', 'Allocation of asset cost', 'Revenue', 'Liability'], correctAnswer: 'Allocation of asset cost', explanation: 'Spreads tangible asset cost over useful life.', topic: 'Accounting' },
    { question: 'Double-entry bookkeeping means:', options: ['Two journals', 'Every debit has equal credit', 'Two auditors', 'Two ledgers only'], correctAnswer: 'Every debit has equal credit', explanation: 'Accounting equation stays balanced.', topic: 'Accounting Rules' },
    { question: 'Current assets include:', options: ['Land', 'Inventory', 'Buildings', 'Patents'], correctAnswer: 'Inventory', explanation: 'Inventory is expected to convert to cash within a year.', topic: 'Balance Sheet', difficulty: 'medium' },
    { question: 'Net profit is:', options: ['Revenue − COGS', 'Revenue − all expenses', 'Assets − liabilities', 'Sales + purchases'], correctAnswer: 'Revenue − all expenses', explanation: 'Bottom line after all costs.', topic: 'P&L' },
    { question: 'Trial balance checks:', options: ['Profit accuracy', 'Debit-credit equality', 'Cash balance', 'Inventory count'], correctAnswer: 'Debit-credit equality', explanation: 'Total debits should equal total credits.', topic: 'Accounting' },
    { question: 'Accounts payable is a:', options: ['Asset', 'Liability', 'Income', 'Expense'], correctAnswer: 'Liability', explanation: 'Amount owed to suppliers.', topic: 'Balance Sheet' },
    { question: 'CGST + SGST apply on:', options: ['Inter-state supply', 'Intra-state supply', 'Exports only', 'Imports only'], correctAnswer: 'Intra-state supply', explanation: 'Intra-state: CGST and SGST split.', topic: 'GST', difficulty: 'medium' },
    { question: 'Working note: Goodwill is:', options: ['Tangible asset', 'Intangible asset', 'Current liability', 'Expense'], correctAnswer: 'Intangible asset', explanation: 'Brand/reputation value not separately identifiable.', topic: 'Accounting', difficulty: 'medium' },
    { question: 'Bank reconciliation matches:', options: ['Two banks', 'Books vs bank statement', 'Sales vs purchases', 'Assets vs equity'], correctAnswer: 'Books vs bank statement', explanation: 'Explains differences between records.', topic: 'Banking' },
    { question: 'Ratio: Current assets / Current liabilities is:', options: ['Quick ratio', 'Current ratio', 'Debt ratio', 'ROA'], correctAnswer: 'Current ratio', explanation: 'Measures short-term liquidity.', topic: 'Ratios' },
    { question: 'TDS is tax deducted:', options: ['At source of income', 'At year end only', 'On exports', 'On capital only'], correctAnswer: 'At source of income', explanation: 'Deducted when income is paid.', topic: 'Taxation', difficulty: 'hard' },
    { question: 'Accrual accounting records revenue when:', options: ['Cash received', 'Earned', 'Invoice printed', 'Product shipped only'], correctAnswer: 'Earned', explanation: 'Revenue recognized when earned, not only when cash received.', topic: 'Accounting', difficulty: 'hard' },
  ]),
  buildTest('legal', 'Legal Reasoning', 'Legal aptitude and analytical reasoning for law placements', 40, 'law', [
    { question: '"Ignorantia juris non excusat" means:', options: ['Ignorance of fact is excuse', 'Ignorance of law is no excuse', 'Law favors vigilant', 'Justice delayed denied'], correctAnswer: 'Ignorance of law is no excuse', explanation: 'Cannot escape liability by claiming ignorance of law.', topic: 'Legal Maxims', difficulty: 'medium' },
    { question: 'Supreme Court of India established under:', options: ['Regulating Act 1773', 'Constitution Article 124', 'GOI Act 1935', 'IPC 1860'], correctAnswer: 'Constitution Article 124', explanation: 'Article 124 establishes SC.', topic: 'Constitutional Law' },
    { question: 'Fundamental Rights are in Part:', options: ['III', 'IV', 'V', 'XII'], correctAnswer: 'III', explanation: 'Part III of Constitution.', topic: 'Constitutional Law' },
    { question: 'Habeas corpus protects against:', options: ['Illegal detention', 'Defamation', 'Breach of contract', 'Tax evasion'], correctAnswer: 'Illegal detention', explanation: 'Writ to produce person unlawfully detained.', topic: 'Writs', difficulty: 'medium' },
    { question: 'IPC stands for:', options: ['Indian Penal Code', 'Indian Property Code', 'Internal Police Code', 'Indian Procedure Code'], correctAnswer: 'Indian Penal Code', explanation: 'Defines criminal offences in India.', topic: 'Criminal Law' },
    { question: 'Ratio decidendi is:', options: ['Obiter dicta', 'Binding reason for decision', 'Dissent only', 'Statute text'], correctAnswer: 'Binding reason for decision', explanation: 'Legal principle forming binding precedent.', topic: 'Jurisprudence', difficulty: 'hard' },
    { question: 'Contract requires:', options: ['Only offer', 'Offer + acceptance + consideration', 'Only consideration', 'Registration always'], correctAnswer: 'Offer + acceptance + consideration', explanation: 'Essential elements of valid contract.', topic: 'Contract Law' },
    { question: 'Preamble of Constitution is:', options: ['Not part of Constitution', 'Part of Constitution', 'Ordinance', 'Amendment only'], correctAnswer: 'Part of Constitution', explanation: 'Kesavananda Bharati case affirmed this.', topic: 'Constitutional Law', difficulty: 'medium' },
    { question: 'Criminal liability needs usually:', options: ['Mens rea + actus reus', 'Only actus reus', 'Only mens rea', 'Witness only'], correctAnswer: 'Mens rea + actus reus', explanation: 'Guilty mind and guilty act.', topic: 'Criminal Law', difficulty: 'medium' },
    { question: 'Lok Adalat awards are:', options: ['Appealable like suit', 'Final and binding', 'Advisory only', 'Void'], correctAnswer: 'Final and binding', explanation: 'Settlement has status of civil court decree.', topic: 'ADR' },
    { question: 'Article 21 guarantees:', options: ['Right to property', 'Right to life and liberty', 'Right to religion', 'Right to education'], correctAnswer: 'Right to life and liberty', explanation: 'Fundamental right to life and personal liberty.', topic: 'Constitutional Law' },
    { question: 'Res judicata means:', options: ['Matter already judged', 'Guilty mind', 'Beyond powers', 'Against person'], correctAnswer: 'Matter already judged', explanation: 'Same issue cannot be relitigated.', topic: 'Legal Maxims', difficulty: 'medium' },
    { question: 'Bail is a:', options: ['Punishment', 'Release mechanism', 'Conviction', 'Appeal'], correctAnswer: 'Release mechanism', explanation: 'Temporary release pending trial.', topic: 'Criminal Procedure' },
    { question: 'Directive Principles are in Part:', options: ['III', 'IV', 'V', 'II'], correctAnswer: 'IV', explanation: 'Part IV — DPSP.', topic: 'Constitutional Law' },
    { question: 'Ultra vires means:', options: ['Within powers', 'Beyond powers', 'In good faith', 'Under contract'], correctAnswer: 'Beyond powers', explanation: 'Act beyond legal authority.', topic: 'Legal Maxims', difficulty: 'hard' },
  ]),
  buildTest('healthcare', 'Healthcare Fundamentals', 'Patient care basics, ethics, and clinical reasoning', 40, 'hc', [
    { question: 'Essential to prevent healthcare-associated infections?', options: ['Skip hand hygiene when busy', 'Proper hand hygiene', 'Reuse gloves on multiple patients', 'Ignore isolation'], correctAnswer: 'Proper hand hygiene', explanation: 'Hand hygiene is the most basic infection prevention.', topic: 'Patient Safety' },
    { question: 'Normal adult resting heart rate (approx)?', options: ['20-40 bpm', '60-100 bpm', '120-150 bpm', '150-180 bpm'], correctAnswer: '60-100 bpm', explanation: 'Typical resting HR range for adults.', topic: 'Vitals' },
    { question: 'HIPAA-like concern in India aligns with:', options: ['Patient confidentiality', 'Public advertising', 'Stock trading', 'Tax filing'], correctAnswer: 'Patient confidentiality', explanation: 'Medical ethics require protecting patient data.', topic: 'Ethics' },
    { question: 'First step in primary survey (trauma)?', options: ['Airway', 'X-ray', 'Medication', 'Discharge'], correctAnswer: 'Airway', explanation: 'ABCDE: Airway first.', topic: 'Emergency Care', difficulty: 'medium' },
    { question: 'Anaphylaxis first-line drug?', options: ['Paracetamol', 'Epinephrine', 'Ibuprofen', 'Antibiotic'], correctAnswer: 'Epinephrine', explanation: 'Epinephrine is first-line for severe allergic reaction.', topic: 'Pharmacology', difficulty: 'medium' },
    { question: 'Blood pressure 140/90 suggests:', options: ['Hypotension', 'Hypertension', 'Normal', 'Bradycardia'], correctAnswer: 'Hypertension', explanation: '≥140/90 mmHg is hypertensive range.', topic: 'Vitals' },
    { question: 'Informed consent requires:', options: ['Only signature', 'Understanding risks/benefits', 'Payment first', 'Family only'], correctAnswer: 'Understanding risks/benefits', explanation: 'Patient must understand procedure and alternatives.', topic: 'Ethics' },
    { question: 'Type 1 diabetes involves:', options: ['Insulin deficiency', 'Only obesity', 'Viral cure', 'No treatment'], correctAnswer: 'Insulin deficiency', explanation: 'Autoimmune destruction of beta cells.', topic: 'Pathophysiology', difficulty: 'medium' },
    { question: 'Sterile technique is critical in:', options: ['Wound dressing in OR', 'Casual conversation', 'Billing desk', 'Parking'], correctAnswer: 'Wound dressing in OR', explanation: 'Surgical settings demand asepsis.', topic: 'Patient Safety' },
    { question: 'CPR compression rate (guidelines)?', options: ['60/min', '100-120/min', '150/min', '30/min'], correctAnswer: '100-120/min', explanation: 'Current guidelines: 100-120 compressions/min.', topic: 'Emergency Care', difficulty: 'medium' },
    { question: 'Isolation for airborne disease uses:', options: ['N95/respirator', 'Only gloves', 'No PPE', 'Open ward'], correctAnswer: 'N95/respirator', explanation: 'Airborne precautions need fitted respirators.', topic: 'Infection Control', difficulty: 'hard' },
    { question: 'Bradycardia means:', options: ['Fast heart rate', 'Slow heart rate', 'High BP', 'Low sugar'], correctAnswer: 'Slow heart rate', explanation: 'Typically HR < 60 bpm in adults.', topic: 'Vitals' },
    { question: 'Medical documentation should be:', options: ['Accurate and timely', 'Optional', 'Verbal only', 'Shared on social media'], correctAnswer: 'Accurate and timely', explanation: 'Records support continuity and legal safety.', topic: 'Ethics' },
    { question: 'HbA1c reflects glucose over:', options: ['1 day', '~3 months', '1 week', '1 year'], correctAnswer: '~3 months', explanation: 'Glycated hemoglobin shows long-term control.', topic: 'Diagnostics', difficulty: 'hard' },
    { question: 'Triage prioritizes patients by:', options: ['Arrival order only', 'Severity/urgency', 'Payment ability', 'Age only'], correctAnswer: 'Severity/urgency', explanation: 'Most urgent cases treated first.', topic: 'Emergency Care' },
  ]),
  buildTest('research', 'Research & Scientific Aptitude', 'Scientific method, data interpretation, and lab reasoning', 40, 'res', [
    { question: 'Testable explanation for an observation is called:', options: ['Theory', 'Hypothesis', 'Law', 'Variable'], correctAnswer: 'Hypothesis', explanation: 'A hypothesis can be tested experimentally.', topic: 'Scientific Method' },
    { question: 'Independent variable is:', options: ['Measured outcome', 'Manipulated factor', 'Control group', 'Error term'], correctAnswer: 'Manipulated factor', explanation: 'Researchers change the independent variable.', topic: 'Experimental Design' },
    { question: 'Peer review ensures:', options: ['Payment', 'Quality and validity', 'Faster publication only', 'No criticism'], correctAnswer: 'Quality and validity', explanation: 'Experts evaluate research before publication.', topic: 'Research Ethics' },
    { question: 'p-value < 0.05 typically means:', options: ['Result statistically significant', 'Result useless', 'Sample too large', 'Hypothesis proven'], correctAnswer: 'Result statistically significant', explanation: 'Often used threshold for significance.', topic: 'Statistics', difficulty: 'medium' },
    { question: 'Control group serves to:', options: ['Increase bias', 'Provide comparison baseline', 'Eliminate sample', 'Replace hypothesis'], correctAnswer: 'Provide comparison baseline', explanation: 'Compare treated vs untreated conditions.', topic: 'Experimental Design' },
    { question: 'SI unit of force?', options: ['Joule', 'Newton', 'Watt', 'Pascal'], correctAnswer: 'Newton', explanation: 'Force measured in newtons (N).', topic: 'Physics' },
    { question: 'Literature review helps to:', options: ['Ignore prior work', 'Contextualize research gap', 'Skip methodology', 'Avoid citations'], correctAnswer: 'Contextualize research gap', explanation: 'Shows what is known and what remains unknown.', topic: 'Research Process' },
    { question: 'Randomization reduces:', options: ['Sample size', 'Selection bias', 'Need for ethics', 'Data collection'], correctAnswer: 'Selection bias', explanation: 'Random assignment balances confounders.', topic: 'Experimental Design', difficulty: 'medium' },
    { question: 'DNA double helix was described by:', options: ['Darwin', 'Watson & Crick', 'Mendel', 'Pasteur'], correctAnswer: 'Watson & Crick', explanation: '1953 structure of DNA.', topic: 'Biology' },
    { question: 'Qualitative research focuses on:', options: ['Numbers only', 'Meanings and experiences', 'Only experiments', 'Equations'], correctAnswer: 'Meanings and experiences', explanation: 'Interviews, themes, narratives.', topic: 'Research Methods' },
    { question: 'Standard deviation measures:', options: ['Central tendency', 'Spread of data', 'Correlation', 'Sample size'], correctAnswer: 'Spread of data', explanation: 'Dispersion around the mean.', topic: 'Statistics', difficulty: 'medium' },
    { question: 'Plagiarism is:', options: ['Proper citation', 'Using others\' work without credit', 'Peer review', 'Replication'], correctAnswer: 'Using others\' work without credit', explanation: 'Serious research ethics violation.', topic: 'Research Ethics' },
    { question: 'Mitochondria function primarily in:', options: ['Photosynthesis', 'ATP production', 'Protein synthesis', 'Cell wall'], correctAnswer: 'ATP production', explanation: 'Powerhouse of the cell.', topic: 'Biology', difficulty: 'medium' },
    { question: 'Correlation does not imply:', options: ['Association', 'Causation', 'Statistics', 'Trend'], correctAnswer: 'Causation', explanation: 'Correlated variables may not cause each other.', topic: 'Statistics', difficulty: 'hard' },
    { question: 'Reproducibility means:', options: ['One-time result', 'Others can replicate findings', 'No data sharing', 'Secret methods'], correctAnswer: 'Others can replicate findings', explanation: 'Core principle of scientific validity.', topic: 'Scientific Method', difficulty: 'hard' },
  ]),
  buildTest('communication', 'Communication & Comprehension', 'Writing clarity, comprehension, and professional communication', 40, 'comm', [
    { question: 'Most professional email opening?', options: ['Hey!', 'I am writing to inquire about...', 'Yo, quick question', 'Listen up'], correctAnswer: 'I am writing to inquire about...', explanation: 'Professional emails use clear, polite openings.', topic: 'Professional Writing' },
    { question: 'Active listening includes:', options: ['Interrupting', 'Paraphrasing speaker', 'Checking phone', 'Planning reply while talking'], correctAnswer: 'Paraphrasing speaker', explanation: 'Reflecting back shows understanding.', topic: 'Interpersonal Skills' },
    { question: 'Subject line in email should be:', options: ['Blank', 'Clear and specific', 'ALL CAPS JOKE', 'Emoji only'], correctAnswer: 'Clear and specific', explanation: 'Helps recipient prioritize and search.', topic: 'Professional Writing' },
    { question: 'Non-verbal communication includes:', options: ['Tone and body language', 'Only written text', 'Server logs', 'Spreadsheets'], correctAnswer: 'Tone and body language', explanation: 'Gestures, posture, facial expressions matter.', topic: 'Communication Basics' },
    { question: 'In meetings, agenda helps to:', options: ['Waste time', 'Structure discussion', 'Avoid notes', 'Skip decisions'], correctAnswer: 'Structure discussion', explanation: 'Agenda sets topics and time.', topic: 'Workplace Communication' },
    { question: 'Constructive feedback should be:', options: ['Personal attack', 'Specific and actionable', 'Vague', 'Public shaming'], correctAnswer: 'Specific and actionable', explanation: 'Focus on behavior and improvement.', topic: 'Feedback', difficulty: 'medium' },
    { question: 'Barriers to communication include:', options: ['Clarity', 'Noise and jargon', 'Empathy', 'Feedback'], correctAnswer: 'Noise and jargon', explanation: 'Physical noise and unclear language hinder understanding.', topic: 'Communication Basics' },
    { question: 'Executive summary is placed:', options: ['At end only', 'At beginning', 'Hidden', 'In appendix always'], correctAnswer: 'At beginning', explanation: 'Summarizes key points upfront for busy readers.', topic: 'Business Writing', difficulty: 'medium' },
    { question: 'Empathy in communication means:', options: ['Agreeing always', 'Understanding others\' perspective', 'Ignoring feelings', 'Dominating talk'], correctAnswer: 'Understanding others\' perspective', explanation: 'Recognize emotions and viewpoints.', topic: 'Interpersonal Skills' },
    { question: 'Which is appropriate for formal report?', options: ['Slang', 'Third person objective tone', 'Text speak', 'Memes'], correctAnswer: 'Third person objective tone', explanation: 'Formal reports use professional objective language.', topic: 'Business Writing' },
    { question: 'Conflict resolution first step often is:', options: ['Blame', 'Listen to all parties', 'Ignore', 'Escalate immediately'], correctAnswer: 'Listen to all parties', explanation: 'Understanding concerns de-escalates tension.', topic: 'Workplace Communication', difficulty: 'medium' },
    { question: 'Presentation best practice:', options: ['Read every slide word-for-word', 'Know audience and key message', 'No visuals ever', 'Speak fastest possible'], correctAnswer: 'Know audience and key message', explanation: 'Tailor content to audience needs.', topic: 'Presentations' },
    { question: 'CC in email means:', options: ['Confidential copy', 'Carbon copy — visible recipients', 'Closed channel', 'Certified copy'], correctAnswer: 'Carbon copy — visible recipients', explanation: 'Others see who received the email.', topic: 'Professional Writing' },
    { question: 'Cultural sensitivity avoids:', options: ['Respect', 'Stereotypes and assumptions', 'Inclusive language', 'Active listening'], correctAnswer: 'Stereotypes and assumptions', explanation: 'Respect diverse backgrounds in global teams.', topic: 'Interpersonal Skills', difficulty: 'hard' },
    { question: 'SMART goals are:', options: ['Vague wishes', 'Specific, Measurable, Achievable, Relevant, Time-bound', 'Secret only', 'Marketing term only'], correctAnswer: 'Specific, Measurable, Achievable, Relevant, Time-bound', explanation: 'Framework for clear goal setting.', topic: 'Professional Development', difficulty: 'hard' },
  ]),
];
