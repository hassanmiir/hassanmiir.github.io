window.COURSE = {
  "title": "Programming with C++",
  "subtitle": "A Hands-On Course for Absolute Beginners",
  "instructor": "Dr. Mir Hassan",
  "affiliation": "Mykolas Romeris University, Vilnius",
  "baseUrl": "https://hassanmiir.github.io/cpp-course",
  "repo": "https://github.com/hassanmiir/hassanmiir.github.io",
  "_unlockHelp": "Set each lecture's unlockDate to YYYY-MM-DD. Before that date the card is locked on the home page and the deck shows a 'locked' notice. Leave unlockDate empty or null to keep a lecture open. Lecture 1 is open by default.",
  "lectures": [
    {
      "id": "lecture1",
      "number": 1,
      "title": "First Steps in C++",
      "tagline": "What a program is, and writing your very first one",
      "goals": [
        "Understand what a program and a programming language are",
        "Write, compile, and run a first C++ program",
        "Use cout to print output to the screen",
        "Recognize the basic anatomy of a C++ program"
      ],
      "handsOn": "Write and run \"Hello, World\", then personalize it to greet yourself by name.",
      "icon": "rocket",
      "unlockDate": ""
    },
    {
      "id": "lecture2",
      "number": 2,
      "title": "Variables and Data Types",
      "tagline": "Storing and naming information",
      "goals": [
        "Declare variables and understand what a type is",
        "Use int, double, char, bool, and string",
        "Read input from the user with cin",
        "Combine input and output into a small interactive program"
      ],
      "handsOn": "Build a program that asks the user's name and age and prints a personalized sentence.",
      "icon": "boxes",
      "unlockDate": "2026-10-13"
    },
    {
      "id": "lecture3",
      "number": 3,
      "title": "Operators and Expressions",
      "tagline": "Doing arithmetic and making comparisons",
      "goals": [
        "Use arithmetic operators (+, -, *, /, %)",
        "Understand integer vs floating-point division",
        "Use comparison and logical operators",
        "Understand operator precedence"
      ],
      "handsOn": "Create a simple calculator that takes two numbers and prints all basic operations.",
      "icon": "calculator",
      "unlockDate": "2026-10-20"
    },
    {
      "id": "lecture4",
      "number": 4,
      "title": "Making Decisions",
      "tagline": "if, else, and choosing between paths",
      "goals": [
        "Write if, else if, and else statements",
        "Combine conditions with logical operators",
        "Use the switch statement",
        "Trace how a program chooses a branch"
      ],
      "handsOn": "Build a grade classifier: enter a score, print the letter grade.",
      "icon": "branch",
      "unlockDate": "2026-10-27"
    },
    {
      "id": "lecture5",
      "number": 5,
      "title": "Loops",
      "tagline": "Repeating work with for and while",
      "goals": [
        "Write while and do-while loops",
        "Write for loops",
        "Use break and continue",
        "Avoid infinite loops and off-by-one errors"
      ],
      "handsOn": "Print a multiplication table and sum the numbers from 1 to N.",
      "icon": "loop",
      "unlockDate": "2026-11-03"
    },
    {
      "id": "lecture6",
      "number": 6,
      "title": "Functions",
      "tagline": "Naming and reusing blocks of logic",
      "goals": [
        "Define and call functions",
        "Understand parameters and return values",
        "Understand scope and local variables",
        "Split a program into small, named pieces"
      ],
      "handsOn": "Refactor the calculator into functions, one per operation.",
      "icon": "function",
      "unlockDate": "2026-11-10"
    },
    {
      "id": "lecture7",
      "number": 7,
      "title": "Arrays and Vectors",
      "tagline": "Working with collections of values",
      "goals": [
        "Store many values in arrays and std::vector",
        "Loop over a collection",
        "Compute totals, averages, maxima, and minima",
        "Understand indices and bounds"
      ],
      "handsOn": "Store a list of test scores and report the average and the highest.",
      "icon": "list",
      "unlockDate": "2026-11-17"
    },
    {
      "id": "lecture8",
      "number": 8,
      "title": "Strings and Text",
      "tagline": "Reading, building, and transforming text",
      "goals": [
        "Use std::string methods",
        "Read full lines with getline",
        "Search, slice, and transform text",
        "Validate simple user input"
      ],
      "handsOn": "Build a tiny text analyzer: count words, characters, and vowels in a sentence.",
      "icon": "text",
      "unlockDate": "2026-11-24"
    },
    {
      "id": "lecture9",
      "number": 9,
      "title": "Structs and Simple Objects",
      "tagline": "Grouping related data together",
      "goals": [
        "Define a struct to model a real-world thing",
        "Create and use a vector of structs",
        "Introduce a class with simple methods",
        "Model the data behind the capstone project"
      ],
      "handsOn": "Model a Student (name, id, grade) and print a small roster.",
      "icon": "cube",
      "unlockDate": "2026-12-01"
    },
    {
      "id": "lecture10",
      "number": 10,
      "title": "Files and Putting It Together",
      "tagline": "Saving data and finishing the capstone",
      "goals": [
        "Read from and write to text files",
        "Persist program data between runs",
        "Organize a complete multi-feature program",
        "Present and demo the capstone project"
      ],
      "handsOn": "Save and load the roster to a file; integrate it into the capstone.",
      "icon": "save",
      "unlockDate": "2026-12-08"
    }
  ],
  "projects": [
    {
      "id": "student-tool",
      "title": "Project A — The Student Study Buddy",
      "audience": "A console tool built FOR students",
      "summary": "A menu-driven program a student would actually use to stay organized: track subjects, log study hours, store grades, and get a simple summary of progress."
    },
    {
      "id": "teacher-tool",
      "title": "Project B — The Teacher Gradebook",
      "audience": "A console tool built FOR teachers",
      "summary": "A menu-driven program a teacher would use to manage a class: add students, record scores, compute class averages, find top and struggling students, and save the gradebook to a file."
    }
  ],
  "access": {
    "_help": "Set 'password' to the word students must type to open a lecture. Change it each class day if you like. Set 'enabled' false to turn the gate off entirely. The gate is a 'do not open early' deterrent, not strong security (static sites can't hide secrets).",
    "enabled": true,
    "password": "cpp2026"
  },
  "instructorTitle": "Associate Professor in Artificial Intelligence and Trustworthy Digital Systems"
};
